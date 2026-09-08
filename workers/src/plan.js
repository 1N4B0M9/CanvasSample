/**
 * Plan generation (Claude Sonnet, streamed).
 * The model emits strict JSONL — one JSON object per line, one line per step — which we
 * parse incrementally so each step hits the SSE stream the moment its line completes.
 */

import { claudeStreamText, MODELS } from './claude.js';

const PLAN_SYSTEM = `You build step-by-step plans for adults rebuilding their lives after coming home, in Pittsburgh, PA.
The reader may have missed the smartphone decade and may read at a 6th-grade level. Warm, steady, practical. Never preachy, never cutesy.

Output format — STRICT:
- Output ONLY JSONL: one JSON object per line, nothing else. No markdown, no code fences, no commentary.
- 4 to 7 lines (steps), in order.
- Each line: {"order": 1, "title": "...", "why": "...", "resourceNeed": "...", "assumption": "..." | null}

Field rules:
- title: short imperative, plain words ("Get your GED", not "Obtain educational credentials"). Under 40 chars.
- why: 1-2 short sentences. Why this step matters for THEIR goal and what to expect. Under 200 chars.
- resourceNeed: what kind of local help this step needs, as a search-able phrase ("free GED classes", "PA childcare subsidy help"). Under 60 chars.
- assumption: if this step relies on an unconfirmed assumption about them, state it plainly ("This assumes you don't have your GED yet"), else null.

Language rules:
- Never: ex-offender, felon, inmate, criminal, incarceration (unless they said it). Say "your record", "since coming home".
- Steps are for THEIR goal, not for an organization's intake process.
- Pittsburgh / Allegheny County / Pennsylvania specifics where they matter (PA clearances, PA licensing).`;

function buildPlanPrompt(intent, answers, corrections) {
	const parts = [`Goal: ${intent.goalSummary}`];
	if (Object.keys(intent.specifics ?? {}).length) {
		parts.push(`Details from their words: ${JSON.stringify(intent.specifics)}`);
	}
	if (answers && Object.keys(answers).length) {
		const answered = (intent.questions ?? []).filter((q) => answers[q.id]).map((q) => `- ${q.text} → ${answers[q.id]}`);
		if (answered.length) parts.push(`They answered:\n${answered.join('\n')}`);
	}
	const unanswered = (intent.questions ?? []).filter((q) => !(answers && answers[q.id]));
	if (unanswered.length) {
		parts.push(
			`Unanswered (make a sensible assumption and surface it in the relevant step's "assumption" field):\n${unanswered
				.map((q) => `- ${q.text}`)
				.join('\n')}`,
		);
	}
	if (intent.assumptions?.length) parts.push(`Working assumptions: ${intent.assumptions.join('; ')}`);
	if (corrections?.length) {
		parts.push(
			`They corrected these assumptions — the plan MUST respect them:\n${corrections.map((c) => `- ${c}`).join('\n')}`,
		);
	}
	parts.push('Build their path now. JSONL only.');
	return parts.join('\n\n');
}

function parseStepLine(line) {
	const trimmed = line
		.trim()
		.replace(/^```(json)?|```$/g, '')
		.trim();
	if (!trimmed.startsWith('{')) return null;
	try {
		const raw = JSON.parse(trimmed);
		if (!raw.title || !raw.order) return null;
		return {
			id: `step-${raw.order}`,
			order: raw.order,
			title: String(raw.title),
			why: String(raw.why ?? ''),
			resourceNeed: String(raw.resourceNeed ?? raw.title),
			assumption: raw.assumption || null,
		};
	} catch {
		return null;
	}
}

/**
 * Stream the plan. Calls onStep(step) as each step's line completes.
 * Resolves with the full ordered steps array.
 */
export async function streamPlan(env, { intent, answers, corrections, onStep }) {
	const steps = [];
	let buffer = '';

	const handleChunk = (chunk) => {
		buffer += chunk;
		let nl = buffer.indexOf('\n');
		while (nl !== -1) {
			const line = buffer.slice(0, nl);
			buffer = buffer.slice(nl + 1);
			const step = parseStepLine(line);
			if (step) {
				steps.push(step);
				if (onStep) onStep(step);
			}
			nl = buffer.indexOf('\n');
		}
	};

	await claudeStreamText(env, {
		model: MODELS.plan,
		system: PLAN_SYSTEM,
		messages: [{ role: 'user', content: buildPlanPrompt(intent, answers, corrections) }],
		maxTokens: 3000,
		onText: handleChunk,
	});

	// flush a final unterminated line
	const last = parseStepLine(buffer);
	if (last) {
		steps.push(last);
		if (onStep) onStep(last);
	}

	return steps;
}
