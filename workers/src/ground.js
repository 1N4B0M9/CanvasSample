/**
 * Step grounding — ONE Sonnet call per plan (not per step): catalog rerank + Anthropic
 * web_search on the same call. `max_uses: 5` is the deterministic per-plan search cap that
 * motivated dropping Sonar — a per-step cap would multiply it away, so all steps ground together.
 */

import { claudeCall, extractToolInput, extractSearchCitations, webSearchTool, MODELS } from './claude.js';

const GROUND_TOOL = {
	name: 'report_grounding',
	description: 'Report which organizations help with each step. Call this exactly once, as your final action.',
	input_schema: {
		type: 'object',
		properties: {
			steps: {
				type: 'array',
				items: {
					type: 'object',
					properties: {
						stepId: { type: 'string' },
						items: {
							type: 'array',
							maxItems: 3,
							items: {
								type: 'object',
								properties: {
									name: { type: 'string' },
									blurb: {
										type: 'string',
										description: 'One plain sentence: what they do for this step. Under 120 chars.',
									},
									phone: { type: 'string', description: 'Phone number if known, else omit.' },
									url: { type: 'string', description: 'Website if known, else omit.' },
									catalogId: {
										type: 'string',
										description: 'The catalog id if this org came from the curated catalog. Omit for web finds.',
									},
								},
								required: ['name', 'blurb'],
							},
						},
					},
					required: ['stepId', 'items'],
				},
			},
		},
		required: ['steps'],
	},
};

const GROUND_SYSTEM = `You match each step of a personal plan to real Pittsburgh-area organizations that can help.
The reader is an adult rebuilding her life after coming home; phone numbers matter more than websites.

For each step:
1. First check the curated catalog (provided). Pick the 0-3 entries that GENUINELY fit the step's need — say none fit rather than stretching.
2. If the catalog doesn't cover the need, use web_search to find real, current Pittsburgh/Allegheny County organizations. Prefer orgs with a phone number. Never invent orgs, phone numbers, or URLs — only report what the catalog or search results actually show.
3. You have at most 5 searches for the WHOLE plan — spend them on the steps the catalog can't answer.

Blurbs: one plain sentence, ~6th-grade reading level, about what they do for THIS step.
Never use: ex-offender, felon, inmate, criminal.
Finish by calling report_grounding exactly once with every step included (empty items list is fine).`;

function condenseCatalog(catalog) {
	return catalog.map(({ id, name, desc, phone, url, goalTypes }) => ({ id, name, desc, phone, url, goalTypes }));
}

/**
 * Ground all steps in one call. Returns { [stepId]: items[] } where each item is
 * { name, blurb, phone?, url?, trust: 'verified'|'web', verifiedAt?, citations[] }.
 * Also returns webFinds[] for the verification queue.
 */
export async function groundSteps(env, { intent, steps, catalog }) {
	const byId = new Map(catalog.map((c) => [c.id, c]));

	const userPrompt = [
		`Goal: ${intent.goalSummary}`,
		`Steps:\n${steps.map((s) => `- ${s.id}: "${s.title}" — needs: ${s.resourceNeed}`).join('\n')}`,
		`Curated catalog (trusted, verified by Project Rebound):\n${JSON.stringify(condenseCatalog(catalog))}`,
		'Ground every step now.',
	].join('\n\n');

	const response = await claudeCall(env, {
		model: MODELS.plan,
		system: GROUND_SYSTEM,
		messages: [{ role: 'user', content: userPrompt }],
		tools: [webSearchTool(5), GROUND_TOOL],
		maxTokens: 4000,
	});

	const grounding = extractToolInput(response, 'report_grounding');
	const searchCitations = extractSearchCitations(response);

	const resourcesByStep = {};
	const webFinds = [];
	for (const step of steps) resourcesByStep[step.id] = [];

	for (const entry of grounding?.steps ?? []) {
		if (!(entry.stepId in resourcesByStep)) continue;
		resourcesByStep[entry.stepId] = (entry.items ?? []).map((item) => {
			const catalogEntry = item.catalogId ? byId.get(item.catalogId) : null;
			if (catalogEntry) {
				return {
					name: catalogEntry.name,
					blurb: item.blurb,
					phone: catalogEntry.phone ?? item.phone ?? null,
					url: catalogEntry.url ?? item.url ?? null,
					trust: 'verified',
					verifiedAt: catalogEntry.lastVerified ?? null,
					citations: [],
				};
			}
			// web find — attach citations whose host matches, else all search citations as provenance
			let citations = [];
			try {
				const host = item.url ? new URL(item.url).host : null;
				citations = host ? searchCitations.filter((c) => c.url.includes(host)) : [];
			} catch {
				citations = [];
			}
			if (!citations.length) citations = searchCitations.slice(0, 3);
			const resource = {
				name: item.name,
				blurb: item.blurb,
				phone: item.phone ?? null,
				url: item.url ?? null,
				trust: 'web',
				citations,
			};
			webFinds.push({
				...resource,
				foundFor: intent.goalSummary,
				goalTypes: intent.facets ?? [],
				stepId: entry.stepId,
			});
			return resource;
		});
	}

	// Unmet-needs log: steps the curated catalog couldn't answer — the team's curation to-do list.
	const unmet = steps.filter((step) => !(resourcesByStep[step.id] ?? []).some((r) => r.trust === 'verified'));
	if (unmet.length) {
		try {
			const existing = (await env.PATHWAYS_KV.get('unmet:v1', 'json')) ?? [];
			const additions = unmet.map((step) => ({
				need: step.resourceNeed,
				goal: intent.goalSummary,
				at: new Date().toISOString(),
			}));
			await env.PATHWAYS_KV.put('unmet:v1', JSON.stringify([...additions, ...existing].slice(0, 200)));
		} catch {
			// analytics only — never block the response
		}
	}

	return { resourcesByStep, webFinds };
}
