/**
 * Plan cache (Workers KV, TTL 7d).
 * The key folds in the intake answer set and corrections — answers vary plans for the
 * same goal, so goal slug alone would serve someone else's assumptions.
 */

const PLAN_TTL_SECONDS = 7 * 24 * 60 * 60;

function slugify(text) {
	return String(text)
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-+|-+$/g, '')
		.slice(0, 60);
}

function hash(text) {
	let h = 5381;
	for (let i = 0; i < text.length; i++) h = ((h << 5) + h + text.charCodeAt(i)) >>> 0;
	return h.toString(36);
}

export function planCacheKey(intent, { answers, skipIntake, corrections } = {}) {
	const goalPart = slugify(intent.goalSummary || (intent.facets ?? []).join('-') || 'goal');
	const answerPart = skipIntake
		? 'skip'
		: hash(
				JSON.stringify(
					Object.keys(answers ?? {})
						.sort()
						.map((k) => [k, answers[k]]),
				),
			);
	const correctionPart = corrections?.length ? hash(JSON.stringify(corrections)) : '0';
	const specificsPart = hash(JSON.stringify(intent.specifics ?? {}));
	return `plan:v1:${goalPart}:${specificsPart}:${answerPart}:${correctionPart}`;
}

export async function getCachedPlan(env, key) {
	return env.PATHWAYS_KV.get(key, 'json').catch(() => null);
}

export async function putCachedPlan(env, key, plan) {
	await env.PATHWAYS_KV.put(key, JSON.stringify(plan), { expirationTtl: PLAN_TTL_SECONDS }).catch(() => {});
}
