/**
 * Intent extraction (Claude Haiku, structured output via forced tool use).
 * Also produces the adaptive-intake questions (≤3, chip answers only) and the crisis flag.
 * Result is KV-cached by query slug so the intake round-trip skips the Haiku hop.
 */

import { claudeCall, extractToolInput, MODELS } from './claude.js';

export const GOAL_TYPES = [
	'professional_license_reinstatement',
	'vocational_training',
	'employment_search',
	'sobriety_recovery',
	'mental_health_counseling',
	'housing_stability',
	'financial_literacy',
	'family_reunification',
	'childcare_support',
	'legal_aid',
	'education_ged_college',
	'peer_support',
];

const INTENT_TOOL = {
	name: 'report_intent',
	description: 'Report the structured understanding of what the user wants to work toward.',
	input_schema: {
		type: 'object',
		properties: {
			goalSummary: {
				type: 'string',
				description: "The goal in the user's own words, short, e.g. 'becoming a teacher'. Lowercase phrase.",
			},
			facets: {
				type: 'array',
				items: { type: 'string', enum: GOAL_TYPES },
				description: 'Which broad goal areas apply (1-3). Used only for filtering, never as the whole meaning.',
			},
			specifics: {
				type: 'object',
				additionalProperties: { type: 'string' },
				description: 'Concrete details from their words: occupation, timeline, constraints, location hints.',
			},
			questions: {
				type: 'array',
				maxItems: 3,
				items: {
					type: 'object',
					properties: {
						id: { type: 'string', description: 'kebab-case id, e.g. ged-status' },
						text: {
							type: 'string',
							description: 'The question, warm and plain, 6th-grade reading level, under 80 chars.',
						},
						options: {
							type: 'array',
							minItems: 2,
							maxItems: 3,
							items: { type: 'string', description: 'Short tappable answer chip, under 25 chars.' },
						},
					},
					required: ['id', 'text', 'options'],
				},
				description:
					'ONLY the 2-3 questions whose answers most change the plan for THIS goal. Empty if the goal is already clear.',
			},
			assumptions: {
				type: 'array',
				items: { type: 'string' },
				description:
					"Assumptions the plan will make if questions go unanswered, phrased plainly ('you don't have your GED yet').",
			},
			crisis: {
				type: 'boolean',
				description:
					'True ONLY for immediate danger: domestic violence, self-harm, suicidal thoughts, someone hurting them now.',
			},
		},
		required: ['goalSummary', 'facets', 'questions', 'assumptions', 'crisis'],
	},
};

const INTENT_SYSTEM = `You understand goals for adults rebuilding their lives after coming home, in Pittsburgh, PA.
Extract what the person wants to work toward from their own words. Never classify away their specifics.

Rules for questions (adaptive intake):
- Ask ONLY questions whose answer would genuinely change the plan's steps. Hard cap: 3. Zero is normal for clear goals.
- Tappable chip answers only, 2-3 options, short. Never ask for free text. Never quiz-like.
- Plain warm language, ~6th-grade reading level.

Rules for language everywhere:
- Never use words like ex-offender, felon, inmate, criminal. Say "your record", "since coming home".
- Do not reference incarceration unless the user did.

Crisis: set crisis=true only for immediate danger, domestic violence, self-harm, or suicidal thoughts. A hard life situation alone is not a crisis.`;

function slugify(text) {
	return text
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-+|-+$/g, '')
		.slice(0, 80);
}

export function intentCacheKey(query) {
	return `intent:v1:${slugify(query)}`;
}

/**
 * Get the intent for a query. KV-cached for 15 minutes so the second /plan call
 * (with intake answers) skips the Haiku hop.
 */
export async function getIntent(env, query, boardContext) {
	const key = intentCacheKey(query);
	const cached = await env.PATHWAYS_KV.get(key, 'json').catch(() => null);
	if (cached) return cached;

	const userContent = boardContext
		? `Their words: "${query}"\n\nContext from their vision board: ${boardContext}`
		: `Their words: "${query}"`;

	const response = await claudeCall(env, {
		model: MODELS.intent,
		system: INTENT_SYSTEM,
		messages: [{ role: 'user', content: userContent }],
		tools: [INTENT_TOOL],
		toolChoice: { type: 'tool', name: 'report_intent' },
		maxTokens: 1024,
	});

	const intent = extractToolInput(response, 'report_intent');
	if (!intent) throw new Error('Intent extraction returned no structured output');

	await env.PATHWAYS_KV.put(key, JSON.stringify(intent), { expirationTtl: 900 }).catch(() => {});
	return intent;
}
