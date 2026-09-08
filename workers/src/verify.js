/**
 * Queue consumer: verify web-discovered orgs off the interactive path.
 * HEAD-check the URL, sanity-check the phone, dedupe against the curated catalog, then
 * store the verdict in KV (`suggestion:*` + `suggestions:index`) for the admin review page.
 * Dead links are dropped here and again by the nightly sweep (`sweepSuggestions`).
 */

import { getCatalog, normalizeUrl } from './catalog.js';

function hash(text) {
	let h = 5381;
	for (let i = 0; i < text.length; i++) h = ((h << 5) + h + text.charCodeAt(i)) >>> 0;
	return h.toString(36);
}

const PHONE_RE = /(\+?1[\s.-]?)?(\(?\d{3}\)?[\s.-]?)?\d{3}[\s.-]?\d{4}/;

const FETCH_HEADERS = {
	// Bare fetches get bot-blocked by many nonprofit/gov sites; look like a normal browser.
	'User-Agent':
		'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0 Safari/537.36',
	Accept: 'text/html,application/xhtml+xml,*/*;q=0.8',
	'Accept-Language': 'en-US,en;q=0.9',
};

/**
 * Link verdict for a human reader:
 *  'checked'  → site answered 2xx/3xx
 *  'dead'     → 404/410, or the connection itself failed (DNS, timeout)
 *  'pending'  → reachable but refused to tell us (401/403/429/5xx — usually bot-blocking), leave for the admin
 */
export async function checkLink(url) {
	const controller = new AbortController();
	const timeout = setTimeout(() => controller.abort(), 8000);
	const classify = (status) => {
		if (status >= 200 && status < 400) return 'checked';
		if (status === 404 || status === 410) return 'dead';
		return 'pending';
	};
	try {
		const res = await fetch(url, {
			method: 'HEAD',
			redirect: 'follow',
			headers: FETCH_HEADERS,
			signal: controller.signal,
		});
		if (res.ok) return 'checked';
		// many sites reject HEAD; confirm with a real GET before judging
		const getRes = await fetch(url, {
			method: 'GET',
			redirect: 'follow',
			headers: FETCH_HEADERS,
			signal: controller.signal,
		});
		return classify(getRes.status);
	} catch {
		return 'dead';
	} finally {
		clearTimeout(timeout);
	}
}

function isDuplicate(find, catalog) {
	const name = find.name.toLowerCase().trim();
	let host = null;
	try {
		host = find.url ? new URL(find.url).host.replace(/^www\./, '') : null;
	} catch {
		host = null;
	}
	return catalog.some((c) => {
		if (c.name.toLowerCase().trim() === name) return true;
		try {
			return host && c.url && new URL(c.url).host.replace(/^www\./, '') === host;
		} catch {
			return false;
		}
	});
}

export async function handleVerifyBatch(batch, env) {
	const catalog = await getCatalog(env).catch(() => []);

	for (const message of batch.messages) {
		try {
			const find = message.body;
			if (!find?.name) {
				message.ack();
				continue;
			}

			if (isDuplicate(find, catalog)) {
				message.ack(); // already curated — nothing to suggest
				continue;
			}

			const url = normalizeUrl(find.url);
			const verifyStatus = url ? await checkLink(url) : 'pending';
			if (verifyStatus === 'dead') {
				console.log(`verify: dropping ${find.name} — link not working (${url})`);
				message.ack(); // nothing for a human to review; it can resurface if found again with a live link
				continue;
			}
			const phoneOk = !find.phone || PHONE_RE.test(find.phone);

			const id = hash(`${find.name}:${find.url ?? ''}`);
			const suggestion = {
				id,
				name: find.name,
				description: find.blurb ?? '',
				contact: { phone: phoneOk ? find.phone ?? null : null, url },
				citations: find.citations ?? [],
				foundFor: find.foundFor ?? null,
				goalTypes: find.goalTypes ?? [],
				verifyStatus,
				status: 'pending',
				createdAt: new Date().toISOString(),
			};

			await env.PATHWAYS_KV.put(`suggestion:${id}`, JSON.stringify(suggestion));
			const index = (await env.PATHWAYS_KV.get('suggestions:index', 'json').catch(() => null)) ?? [];
			if (!index.includes(id)) {
				index.push(id);
				await env.PATHWAYS_KV.put('suggestions:index', JSON.stringify(index));
			}

			message.ack();
		} catch (err) {
			console.error('verify consumer error:', err.message);
			message.retry();
		}
	}
}

/**
 * Cron sweep: re-check every queued suggestion's link; an entry that is dead on two consecutive
 * sweeps is discarded, so the admin queue only holds organizations a person can actually reach.
 * Returns { checked, removed, kept }.
 */
export async function sweepSuggestions(env) {
	const index = (await env.PATHWAYS_KV.get('suggestions:index', 'json').catch(() => null)) ?? [];
	const kept = [];
	let checked = 0;
	let removed = 0;

	for (const id of index) {
		const suggestion = await env.PATHWAYS_KV.get(`suggestion:${id}`, 'json').catch(() => null);
		if (!suggestion) {
			removed++; // orphaned index entry
			continue;
		}
		const url = normalizeUrl(suggestion.contact?.url);
		if (!url) {
			kept.push(id); // nothing to check; stays 'pending' for the admin
			continue;
		}
		checked++;
		const verifyStatus = await checkLink(url);
		const deadStrikes = verifyStatus === 'dead' ? (suggestion.deadStrikes ?? 0) + 1 : 0;
		if (deadStrikes >= 2) {
			await env.PATHWAYS_KV.delete(`suggestion:${id}`).catch(() => {});
			removed++;
			console.log(`sweep: removed ${suggestion.name} — link not working twice (${url})`);
			continue;
		}
		if (verifyStatus === 'dead') console.log(`sweep: strike ${deadStrikes} for ${suggestion.name} (${url})`);
		await env.PATHWAYS_KV.put(
			`suggestion:${id}`,
			JSON.stringify({
				...suggestion,
				contact: { ...(suggestion.contact ?? {}), url },
				verifyStatus,
				deadStrikes,
				lastCheckedAt: new Date().toISOString(),
			}),
		).catch(() => {});
		kept.push(id);
	}

	if (kept.length !== index.length) await env.PATHWAYS_KV.put('suggestions:index', JSON.stringify(kept));
	return { checked, removed, kept: kept.length };
}
