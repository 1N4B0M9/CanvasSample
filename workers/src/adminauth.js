/**
 * Verifies a Firebase Auth ID token (RS256 JWT) and checks it belongs to the admin.
 * Lets the admin review page talk to the worker without any new secrets: the browser
 * sends the admin's own Firebase ID token; we verify it against Google's public JWKS.
 */

const JWKS_URL = 'https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com';
const JWKS_CACHE_KEY = 'jwks:securetoken';

function b64urlToBytes(b64url) {
	const b64 = b64url.replace(/-/g, '+').replace(/_/g, '/');
	const bin = atob(b64);
	const bytes = new Uint8Array(bin.length);
	for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
	return bytes;
}

function decodeSegment(segment) {
	return JSON.parse(new TextDecoder().decode(b64urlToBytes(segment)));
}

async function getJwks(env) {
	const cached = await env.PATHWAYS_KV.get(JWKS_CACHE_KEY, 'json').catch(() => null);
	if (cached) return cached;
	const res = await fetch(JWKS_URL);
	if (!res.ok) throw new Error('JWKS fetch failed');
	const jwks = await res.json();
	await env.PATHWAYS_KV.put(JWKS_CACHE_KEY, JSON.stringify(jwks), { expirationTtl: 3600 }).catch(() => {});
	return jwks;
}

/**
 * Returns the verified admin uid, or null if the request isn't a valid admin token.
 */
export async function verifyAdmin(env, request) {
	try {
		const header = request.headers.get('Authorization') ?? '';
		if (!header.startsWith('Bearer ')) return null;
		const token = header.slice(7);

		const [h, p, s] = token.split('.');
		if (!h || !p || !s) return null;
		const head = decodeSegment(h);
		const payload = decodeSegment(p);
		if (head.alg !== 'RS256') return null;

		// claims first (cheap): issuer, audience, expiry, and that it IS the admin
		const now = Math.floor(Date.now() / 1000);
		if (payload.aud !== env.FIREBASE_PROJECT_ID) return null;
		if (payload.iss !== `https://securetoken.google.com/${env.FIREBASE_PROJECT_ID}`) return null;
		if (!(payload.exp > now)) return null;
		const uid = payload.user_id ?? payload.sub;
		if (!env.ADMIN_UID || uid !== env.ADMIN_UID) return null;

		// signature
		const jwks = await getJwks(env);
		const jwk = (jwks.keys ?? []).find((k) => k.kid === head.kid);
		if (!jwk) return null;
		const key = await crypto.subtle.importKey('jwk', jwk, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, [
			'verify',
		]);
		const valid = await crypto.subtle.verify(
			'RSASSA-PKCS1-v1_5',
			key,
			b64urlToBytes(s),
			new TextEncoder().encode(`${h}.${p}`),
		);
		return valid ? uid : null;
	} catch {
		return null;
	}
}
