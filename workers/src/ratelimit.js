/**
 * Per-IP daily rate limit for the public /plan endpoint (real API cost behind it).
 * KV counter, not atomic — good enough for friendly limiting; Turnstile can layer on later.
 */

const DAILY_LIMIT = 20;

export const RATE_LIMIT_MESSAGE =
	"You've built a lot of paths today. Come back tomorrow and we'll pick it up from there.";

export async function checkRateLimit(env, ip) {
	if (!ip) return { allowed: true, remaining: DAILY_LIMIT };
	const day = new Date().toISOString().slice(0, 10);
	const key = `rl:${ip}:${day}`;

	const current = Number((await env.PATHWAYS_KV.get(key).catch(() => null)) ?? 0);
	if (current >= DAILY_LIMIT) return { allowed: false, remaining: 0 };

	// TTL a bit over a day so the key outlives its own date window
	await env.PATHWAYS_KV.put(key, String(current + 1), { expirationTtl: 90000 }).catch(() => {});
	return { allowed: true, remaining: DAILY_LIMIT - current - 1 };
}
