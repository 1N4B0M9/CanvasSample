/**
 * Pathway v2 worker — "My Path".
 * POST /plan      → SSE: intent | clarify | crisis | step | resources | done | error
 * POST /substeps  → JSON (legacy-compatible shape for the "Ask about this step" flow)
 * queue()         → resource-verify consumer (background verification flywheel)
 * scheduled()     → nightly catalog sync Firestore → KV
 */

import { getIntent } from './intent.js';
import { streamPlan } from './plan.js';
import { groundSteps } from './ground.js';
import { getCatalog, syncCatalog } from './catalog.js';
import { planCacheKey, getCachedPlan, putCachedPlan } from './cache.js';
import { checkRateLimit, RATE_LIMIT_MESSAGE } from './ratelimit.js';
import { HOTLINES } from './crisis.js';
import { handleVerifyBatch, sweepSuggestions } from './verify.js';
import { verifyAdmin } from './adminauth.js';
import { claudeCall, extractToolInput, extractSearchCitations, webSearchTool, MODELS } from './claude.js';

const CORS_HEADERS = {
	'Access-Control-Allow-Origin': '*',
	'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
	'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

const FRIENDLY_ERROR = 'Something went wrong on our end. Try again in a minute.';

function json(data, status = 200) {
	return new Response(JSON.stringify(data), {
		status,
		headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
	});
}

// ---------------------------------------------------------------- /plan (SSE)

function sseWriter(writable) {
	const writer = writable.getWriter();
	const encoder = new TextEncoder();
	return {
		send: (event, data) => writer.write(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)),
		close: () => writer.close().catch(() => {}),
	};
}

async function runPlanPipeline(env, body, sse) {
	const { query, boardContext, answers, skipIntake, corrections } = body;

	// ① intent (KV-cached so the intake round-trip skips the Haiku hop)
	const intent = await getIntent(env, query, boardContext);

	// crisis short-circuit — no generated content
	if (intent.crisis) {
		await sse.send('crisis', { hotlines: HOTLINES });
		return;
	}

	// ①b adaptive intake: first call with open questions emits intent + clarify and ends
	const hasQuestions = (intent.questions ?? []).length > 0;
	const intakeResolved = skipIntake || (answers && Object.keys(answers).length > 0);
	if (hasQuestions && !intakeResolved) {
		await sse.send('intent', { goalSummary: intent.goalSummary, assumptions: intent.assumptions ?? [] });
		await sse.send('clarify', { questions: intent.questions });
		return;
	}

	// plan cache — key folds in the answer set and corrections, not just the goal slug
	const cacheKey = planCacheKey(intent, { answers, skipIntake, corrections });
	const cached = await getCachedPlan(env, cacheKey);
	if (cached) {
		await sse.send('intent', { goalSummary: intent.goalSummary, assumptions: intent.assumptions ?? [] });
		for (const step of cached.steps) await sse.send('step', step);
		for (const [stepId, items] of Object.entries(cached.resourcesByStep ?? {})) {
			await sse.send('resources', { stepId, items });
		}
		await sse.send('done', { planId: cached.planId, cached: true });
		return;
	}

	await sse.send('intent', { goalSummary: intent.goalSummary, assumptions: intent.assumptions ?? [] });

	// ② plan — streamed, each step hits the wire as its line completes
	const steps = await streamPlan(env, {
		intent,
		answers,
		corrections,
		onStep: (step) => sse.send('step', step),
	});
	if (!steps.length) throw new Error('Plan generation produced no steps');

	// ③ ground — one Sonnet call for the whole plan: catalog rerank + web_search (max 5 searches/plan)
	const catalog = await getCatalog(env);
	const { resourcesByStep, webFinds } = await groundSteps(env, { intent, steps, catalog });
	for (const [stepId, items] of Object.entries(resourcesByStep)) {
		await sse.send('resources', { stepId, items });
	}

	// ④ enqueue web finds for background verification (never blocks the response)
	if (webFinds.length && env.VERIFY_QUEUE) {
		await Promise.allSettled(webFinds.map((find) => env.VERIFY_QUEUE.send(find)));
	}

	// ⑤ respond + cache
	const planId = `${cacheKey}:${Date.now().toString(36)}`;
	await putCachedPlan(env, cacheKey, { planId, intent, steps, resourcesByStep });
	await sse.send('done', { planId, cached: false });
}

async function handlePlan(request, env, ctx) {
	let body;
	try {
		body = await request.json();
	} catch {
		return json({ message: FRIENDLY_ERROR }, 400);
	}
	if (!body.query || typeof body.query !== 'string' || !body.query.trim()) {
		return json({ message: 'Tell us what you want to work toward, in your own words.' }, 400);
	}

	const ip = request.headers.get('CF-Connecting-IP');
	const { allowed } = await checkRateLimit(env, ip);
	if (!allowed) return json({ message: RATE_LIMIT_MESSAGE }, 429);

	const { readable, writable } = new TransformStream();
	const sse = sseWriter(writable);

	ctx.waitUntil(
		(async () => {
			try {
				await runPlanPipeline(env, body, sse);
			} catch (err) {
				console.error('plan pipeline error:', err.message);
				await sse.send('error', { message: FRIENDLY_ERROR }).catch(() => {});
			} finally {
				sse.close();
			}
		})(),
	);

	return new Response(readable, {
		headers: {
			'Content-Type': 'text/event-stream',
			'Cache-Control': 'no-cache',
			Connection: 'keep-alive',
			...CORS_HEADERS,
		},
	});
}

// ---------------------------------------------------------------- /substeps

const SUBSTEPS_TOOL = {
	name: 'report_substeps',
	description: 'Report 3-5 concrete sub-steps. Call exactly once, as your final action.',
	input_schema: {
		type: 'object',
		properties: {
			steps: {
				type: 'array',
				minItems: 3,
				maxItems: 5,
				items: {
					type: 'object',
					properties: {
						order: { type: 'integer' },
						title: { type: 'string', description: 'Short imperative, plain words, under 40 chars.' },
						detail: { type: 'string', description: '1-2 short sentences, ~6th-grade reading level. Under 160 chars.' },
						label: { type: 'string', description: 'Optional 1-3 word action label for the arrow to this step.' },
					},
					required: ['order', 'title', 'detail'],
				},
			},
		},
		required: ['steps'],
	},
};

async function handleSubsteps(request, env) {
	let body;
	try {
		body = await request.json();
	} catch {
		return json({ message: FRIENDLY_ERROR }, 400);
	}
	const { goalText, stepText, userQuery } = body;
	if (!stepText) return json({ message: FRIENDLY_ERROR }, 400);

	try {
		const prompt = [
			`Goal: ${goalText ?? stepText}`,
			`Step to break down: ${stepText}`,
			userQuery ? `Their question about it: ${userQuery}` : null,
			'Break this step into 3-5 concrete sub-steps for Pittsburgh, PA. Use web_search only if you need current local facts.',
		]
			.filter(Boolean)
			.join('\n\n');

		const response = await claudeCall(env, {
			model: MODELS.plan,
			system:
				'You break one step of a life-rebuilding plan into concrete sub-steps for an adult in Pittsburgh, PA who may read at a 6th-grade level. Plain warm language. Never: ex-offender, felon, inmate, criminal. Finish by calling report_substeps exactly once.',
			messages: [{ role: 'user', content: prompt }],
			tools: [webSearchTool(2), SUBSTEPS_TOOL],
			maxTokens: 2000,
		});

		const result = extractToolInput(response, 'report_substeps');
		if (!result?.steps?.length) throw new Error('No sub-steps returned');

		// legacy-compatible shape: { steps, searchResults }
		const searchResults = extractSearchCitations(response).map((c) => ({ title: c.title, url: c.url, date: null }));
		return json({ steps: result.steps, searchResults });
	} catch (err) {
		console.error('substeps error:', err.message);
		return json({ message: FRIENDLY_ERROR }, 500);
	}
}

// ------------------------------------------------- /suggestions (admin only)

/** The review-queue feed: verified web finds waiting for approval, plus the unmet-needs list. */
async function handleSuggestionsList(request, env) {
	if (!(await verifyAdmin(env, request))) return json({ message: 'Not authorized' }, 401);

	const index = (await env.PATHWAYS_KV.get('suggestions:index', 'json').catch(() => null)) ?? [];
	const suggestions = (
		await Promise.all(index.map((id) => env.PATHWAYS_KV.get(`suggestion:${id}`, 'json').catch(() => null)))
	).filter(Boolean);
	const unmetNeeds = (await env.PATHWAYS_KV.get('unmet:v1', 'json').catch(() => null)) ?? [];
	return json({ suggestions, unmetNeeds });
}

/** Admin resolved a suggestion (approved → the admin page writes it into Firestore itself). */
async function handleSuggestionResolve(request, env) {
	if (!(await verifyAdmin(env, request))) return json({ message: 'Not authorized' }, 401);

	let body;
	try {
		body = await request.json();
	} catch {
		return json({ message: 'Bad request' }, 400);
	}
	const { id, status } = body;
	if (!id || !['approved', 'rejected'].includes(status)) return json({ message: 'Bad request' }, 400);

	await env.PATHWAYS_KV.delete(`suggestion:${id}`).catch(() => {});
	const index = (await env.PATHWAYS_KV.get('suggestions:index', 'json').catch(() => null)) ?? [];
	await env.PATHWAYS_KV.put('suggestions:index', JSON.stringify(index.filter((x) => x !== id))).catch(() => {});
	return json({ ok: true, id, status });
}

// ------------------------------------------------- /catalog/sync (admin only)

/** Re-mirror Firestore `resources` → KV now, so a just-approved org reaches the next plan immediately. */
async function handleCatalogSync(request, env) {
	if (!(await verifyAdmin(env, request))) return json({ message: 'Not authorized' }, 401);
	const count = await syncCatalog(env);
	if (count == null) return json({ message: 'Catalog sync failed' }, 502);
	return json({ ok: true, count });
}

// ---------------------------------------------------------------- entrypoints

export default {
	async fetch(request, env, ctx) {
		if (request.method === 'OPTIONS') return new Response(null, { headers: CORS_HEADERS });

		const { pathname } = new URL(request.url);

		if (request.method === 'GET' && pathname === '/health') return json({ ok: true });

		if (request.method === 'POST' && (pathname === '/' || pathname === '/plan')) {
			return handlePlan(request, env, ctx);
		}
		if (request.method === 'POST' && pathname === '/substeps') {
			return handleSubsteps(request, env);
		}
		if (request.method === 'GET' && pathname === '/suggestions') {
			return handleSuggestionsList(request, env);
		}
		if (request.method === 'POST' && pathname === '/suggestions/resolve') {
			return handleSuggestionResolve(request, env);
		}
		if (request.method === 'POST' && pathname === '/catalog/sync') {
			return handleCatalogSync(request, env);
		}

		return json({ message: 'Not found' }, 404);
	},

	async queue(batch, env) {
		await handleVerifyBatch(batch, env);
	},

	async scheduled(event, env, ctx) {
		ctx.waitUntil(
			Promise.all([
				syncCatalog(env).then((count) => {
					console.log(
						count == null ? 'catalog sync failed (missing key or rules?)' : `catalog synced: ${count} resources`,
					);
				}),
				sweepSuggestions(env)
					.then(({ checked, removed, kept }) =>
						console.log(`suggestion sweep: ${checked} links checked, ${removed} dead removed, ${kept} kept`),
					)
					.catch((err) => console.error('suggestion sweep failed:', err.message)),
			]),
		);
	},
};
