/**
 * Anthropic API client helpers for the pathway worker.
 * One vendor, one key: intent (Haiku), plan + grounding (Sonnet w/ web_search).
 */

const API_URL = 'https://api.anthropic.com/v1/messages';
const API_VERSION = '2023-06-01';

export const MODELS = {
	intent: 'claude-haiku-4-5-20251001',
	plan: 'claude-sonnet-4-6',
};

export function webSearchTool(maxUses) {
	return {
		type: 'web_search_20260209',
		name: 'web_search',
		max_uses: maxUses,
		user_location: {
			type: 'approximate',
			city: 'Pittsburgh',
			region: 'Pennsylvania',
			country: 'US',
			timezone: 'America/New_York',
		},
	};
}

/**
 * The key arrives as a Secrets Store binding (object with .get()) in production,
 * or a plain string from `wrangler secret put` / `.dev.vars` in local dev.
 */
async function resolveApiKey(env) {
	const binding = env.ANTHROPIC_API_KEY;
	if (binding && typeof binding.get === 'function') return binding.get();
	return binding;
}

async function headers(env) {
	return {
		'Content-Type': 'application/json',
		'x-api-key': await resolveApiKey(env),
		'anthropic-version': API_VERSION,
	};
}

/** Non-streaming call. Returns the full response body (throws on non-2xx). */
export async function claudeCall(env, { model, system, messages, tools, toolChoice, maxTokens = 2048 }) {
	const body = { model, system, messages, max_tokens: maxTokens };
	if (tools) body.tools = tools;
	if (toolChoice) body.tool_choice = toolChoice;

	const res = await fetch(API_URL, { method: 'POST', headers: await headers(env), body: JSON.stringify(body) });
	if (!res.ok) {
		const text = await res.text().catch(() => '');
		throw new Error(`Anthropic API ${res.status}: ${text.slice(0, 300)}`);
	}
	return res.json();
}

/** Pull the input object of the first tool_use block with the given name. */
export function extractToolInput(response, toolName) {
	const block = (response.content ?? []).find((b) => b.type === 'tool_use' && b.name === toolName);
	return block ? block.input : null;
}

/** Collect citations from web_search tool results: [{ url, title }]. */
export function extractSearchCitations(response) {
	const citations = [];
	for (const block of response.content ?? []) {
		if (block.type === 'web_search_tool_result' && Array.isArray(block.content)) {
			for (const item of block.content) {
				if (item.type === 'web_search_result' && item.url) {
					citations.push({ url: item.url, title: item.title ?? item.url });
				}
			}
		}
		// text blocks may carry citations arrays too
		if (block.type === 'text' && Array.isArray(block.citations)) {
			for (const c of block.citations) {
				if (c.url) citations.push({ url: c.url, title: c.title ?? c.url });
			}
		}
	}
	// dedupe by url
	const seen = new Set();
	return citations.filter((c) => (seen.has(c.url) ? false : seen.add(c.url)));
}

/**
 * Streaming call that surfaces text deltas as they arrive.
 * Calls onText(chunk) for every text delta; resolves with the full text when the stream ends.
 */
export async function claudeStreamText(env, { model, system, messages, maxTokens = 3000, onText }) {
	const body = { model, system, messages, max_tokens: maxTokens, stream: true };
	const res = await fetch(API_URL, { method: 'POST', headers: await headers(env), body: JSON.stringify(body) });
	if (!res.ok) {
		const text = await res.text().catch(() => '');
		throw new Error(`Anthropic API ${res.status}: ${text.slice(0, 300)}`);
	}

	const reader = res.body.getReader();
	const decoder = new TextDecoder();
	let buffer = '';
	let fullText = '';

	// eslint-disable-next-line no-constant-condition
	while (true) {
		const { done, value } = await reader.read();
		if (done) break;
		buffer += decoder.decode(value, { stream: true });

		const events = buffer.split('\n\n');
		buffer = events.pop(); // last piece may be incomplete
		for (const evt of events) {
			for (const line of evt.split('\n')) {
				if (!line.startsWith('data: ')) continue;
				let parsed;
				try {
					parsed = JSON.parse(line.slice(6));
				} catch {
					continue;
				}
				if (parsed.type === 'content_block_delta' && parsed.delta?.type === 'text_delta') {
					fullText += parsed.delta.text;
					if (onText) onText(parsed.delta.text);
				}
				if (parsed.type === 'error') {
					throw new Error(`Anthropic stream error: ${parsed.error?.message ?? 'unknown'}`);
				}
			}
		}
	}
	return fullText;
}
