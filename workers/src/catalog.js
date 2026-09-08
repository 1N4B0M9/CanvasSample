/**
 * Curated-catalog sync: Firestore `resources` → condensed catalog → KV (`catalog:v1`).
 * Reads over Firestore REST with the web API key (requires the `resources` public-read rule).
 * Degrades gracefully to an empty catalog — grounding then runs web-only.
 */

const CATALOG_KEY = 'catalog:v1';
const CATALOG_MAX_AGE_MS = 24 * 60 * 60 * 1000; // lazy refresh if cron hasn't run

/**
 * Make a website value safe to use as an absolute link. Catalog entries (and some web finds)
 * arrive scheme-less ("ccac.edu"), which a browser resolves RELATIVE to the app — the Website
 * button then lands on the app's own home page. Returns an https://… string or null.
 */
export function normalizeUrl(raw) {
	if (raw == null) return null;
	let value = String(raw).trim();
	if (!value) return null;
	if (!/^https?:\/\//i.test(value)) {
		if (/^[a-z][a-z0-9+.-]*:/i.test(value)) return null; // mailto:, tel:, etc. are not websites
		value = `https://${value.replace(/^\/+/, '')}`;
	}
	try {
		const parsed = new URL(value);
		if (!['http:', 'https:'].includes(parsed.protocol) || !parsed.hostname.includes('.')) return null;
		return parsed.href;
	} catch {
		return null;
	}
}

function fsValue(v) {
	if (v == null) return null;
	if ('stringValue' in v) return v.stringValue;
	if ('integerValue' in v) return Number(v.integerValue);
	if ('doubleValue' in v) return v.doubleValue;
	if ('booleanValue' in v) return v.booleanValue;
	if ('timestampValue' in v) return v.timestampValue;
	if ('arrayValue' in v) return (v.arrayValue.values ?? []).map(fsValue);
	if ('mapValue' in v) {
		const out = {};
		for (const [k, val] of Object.entries(v.mapValue.fields ?? {})) out[k] = fsValue(val);
		return out;
	}
	return null;
}

async function fetchCatalogFromFirestore(env) {
	if (!env.FIREBASE_API_KEY) return null;

	const url = `https://firestore.googleapis.com/v1/projects/${env.FIREBASE_PROJECT_ID}/databases/(default)/documents:runQuery?key=${env.FIREBASE_API_KEY}`;
	const res = await fetch(url, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({
			structuredQuery: {
				from: [{ collectionId: 'resources' }],
				where: {
					fieldFilter: { field: { fieldPath: 'active' }, op: 'EQUAL', value: { booleanValue: true } },
				},
				limit: 500,
			},
		}),
	});
	if (!res.ok) return null;

	const rows = await res.json();
	const items = [];
	for (const row of rows) {
		if (!row.document) continue;
		const fields = row.document.fields ?? {};
		const id = row.document.name.split('/').pop();
		const contact = fsValue(fields.contact) ?? {};
		items.push({
			id,
			name: fsValue(fields.name) ?? id,
			desc: fsValue(fields.description) ?? '',
			phone: contact.phone ?? fsValue(fields.phone) ?? null,
			url: normalizeUrl(contact.url ?? fsValue(fields.url)),
			goalTypes: fsValue(fields.goalTypes) ?? [],
			domains: fsValue(fields.domains) ?? [],
			lastVerified: fsValue(fields.lastVerified) ?? null,
		});
	}
	return items;
}

/** Force a refresh (cron path). Returns the item count, or null on failure. */
export async function syncCatalog(env) {
	const items = await fetchCatalogFromFirestore(env).catch(() => null);
	if (!items) return null;
	await env.PATHWAYS_KV.put(CATALOG_KEY, JSON.stringify({ fetchedAt: Date.now(), items }));
	return items.length;
}

/** Read the catalog, lazily refreshing if stale/missing. Always resolves to an array. */
export async function getCatalog(env) {
	const cached = await env.PATHWAYS_KV.get(CATALOG_KEY, 'json').catch(() => null);
	if (cached && Date.now() - (cached.fetchedAt ?? 0) < CATALOG_MAX_AGE_MS) return cached.items;

	const items = await fetchCatalogFromFirestore(env).catch(() => null);
	if (items) {
		await env.PATHWAYS_KV.put(CATALOG_KEY, JSON.stringify({ fetchedAt: Date.now(), items })).catch(() => {});
		return items;
	}
	return cached?.items ?? [];
}
