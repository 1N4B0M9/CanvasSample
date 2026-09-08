/**
 * Queue consumer: verify web-discovered orgs off the interactive path.
 * HEAD-check the URL, sanity-check the phone, dedupe against the curated catalog, then
 * store the verdict in KV (`suggestion:*` + `suggestions:index`). Phase 3 moves these
 * into Firestore `resource_suggestions` for the admin review page.
 */

import { getCatalog } from './catalog.js';

function hash(text) {
	let h = 5381;
	for (let i = 0; i < text.length; i++) h = ((h << 5) + h + text.charCodeAt(i)) >>> 0;
	return h.toString(36);
}

const PHONE_RE = /(\+?1[\s.-]?)?(\(?\d{3}\)?[\s.-]?)?\d{3}[\s.-]?\d{4}/;

async function headCheck(url) {
	const controller = new AbortController();
	const timeout = setTimeout(() => controller.abort(), 8000);
	try {
		const res = await fetch(url, { method: 'HEAD', redirect: 'follow', signal: controller.signal });
		if (res.ok) return 'checked';
		// some sites reject HEAD; fall back to a lightweight GET
		if (res.status === 405 || res.status === 403) {
			const getRes = await fetch(url, { method: 'GET', redirect: 'follow', signal: controller.signal });
			return getRes.ok ? 'checked' : 'dead';
		}
		return 'dead';
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

			const verifyStatus = find.url ? await headCheck(find.url) : 'pending';
			const phoneOk = !find.phone || PHONE_RE.test(find.phone);

			const id = hash(`${find.name}:${find.url ?? ''}`);
			const suggestion = {
				id,
				name: find.name,
				description: find.blurb ?? '',
				contact: { phone: phoneOk ? find.phone ?? null : null, url: find.url ?? null },
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
