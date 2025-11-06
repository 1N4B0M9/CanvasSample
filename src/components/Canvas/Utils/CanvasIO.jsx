// src/components/Canvas/Utils/CanvasIO.js
import { getStorage, ref as storageRef, uploadString, getDownloadURL, getBlob } from 'firebase/storage';

/* ---------------- constants ---------------- */

const EMPTY_PNG =
	'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGNgYAAAAAMAASsJTYQAAAAASUVORK5CYII=';

/* ============== helpers: base64 <-> blob/objectURL ============== */

function fileToDataUrl(fileOrBlob) {
	return new Promise((resolve, reject) => {
		const r = new FileReader();
		r.onload = () => resolve(r.result); // "data:<mime>;base64,..."
		r.onerror = reject;
		r.readAsDataURL(fileOrBlob);
	});
}

async function dataUrlToObjectUrl(dataUrl) {
	const res = await fetch(dataUrl);
	const blob = await res.blob();
	const objectUrl = URL.createObjectURL(blob);
	return { blob, objectUrl };
}

/* ====================== 1) ConvertCanvasToJson ====================== */
/**
 * Convert an array of canvases into a JSON-safe structure.
 * - Any runtime image fields (file/blob/objectUrl/src/fileUrl) are stripped.
 * - Images are inlined to base64 data URLs at inlineData.dataUrl when needed.
 */
async function serializeElement(el) {
	if (!el || typeof el !== 'object') return el;
	const {
		file,
		blob,
		objectUrl, // strip
		fileUrl, // strip
		src, // strip
		...rest
	} = el;

	// Already inlined
	if (el?.inlineData?.dataUrl) return { ...rest, inlineData: { ...el.inlineData } };

	if (typeof File !== 'undefined' && file instanceof File) {
		const dataUrl = await fileToDataUrl(file);
		return {
			...rest,
			inlineData: {
				dataUrl,
				mimeType: file.type || 'application/octet-stream',
				originalName: file.name || 'image',
				size: file.size ?? undefined,
			},
		};
	}

	if (blob instanceof Blob) {
		const dataUrl = await fileToDataUrl(blob);
		return {
			...rest,
			inlineData: { dataUrl, mimeType: blob.type || 'application/octet-stream' },
		};
	}

	if (typeof objectUrl === 'string' && objectUrl.startsWith('blob:')) {
		const res = await fetch(objectUrl);
		const b = await res.blob();
		const dataUrl = await fileToDataUrl(b);
		return {
			...rest,
			inlineData: { dataUrl, mimeType: b.type || 'application/octet-stream' },
		};
	}

	// If it references a normal URL or storage path, it's already serializable
	return { ...rest };
}

export async function ConvertCanvasToJson(canvases) {
	const out = [];
	for (const c of canvases || []) {
		const elements = c?.data?.elements || [];
		const serializedEls = [];
		for (const el of elements) serializedEls.push(await serializeElement(el));

		const bg = c?.data?.backgroundImage;
		const serializedBg = bg ? await serializeElement(bg) : null;

		out.push({
			id: c.id,
			name: c.name,
			data: {
				...c.data,
				elements: serializedEls,
				backgroundImage: serializedBg,
			},
		});
	}
	return out;
}

/* ====================== 2) ConvertJsonToCanvas ====================== */
/**
 * Rehydrate base64 inline images (inlineData.dataUrl) into runtime object URLs.
 * Also sets a stable `src` for immediate rendering:
 *   src = objectUrl || inlineData.dataUrl || EMPTY_PNG
 * Returns { canvases, urls } so the caller can later revoke URLs.
 */
export async function ConvertJsonToCanvas(jsonArray) {
	const urls = [];

	const withSrc = (obj, objectUrl) => {
		const inline = obj?.inlineData?.dataUrl;
		const src = objectUrl || inline || EMPTY_PNG;
		return { ...obj, ...(objectUrl ? { objectUrl } : {}), src };
	};

	const rehydrateEl = async (el) => {
		if (!el || typeof el !== 'object') return el;
		// strip any stale src/objectUrl/fileUrl from stored JSON just in case
		const { file, fileUrl, objectUrl: _oldObj, src: _oldSrc, ...clean } = el;

		if (el?.inlineData?.dataUrl) {
			try {
				const { objectUrl } = await dataUrlToObjectUrl(el.inlineData.dataUrl);
				urls.push(objectUrl);
				return withSrc(clean, objectUrl);
			} catch {
				return withSrc(clean, null);
			}
		}
		// no inline data → keep as-is but ensure src exists
		return withSrc(clean, null);
	};

	const out = [];
	for (const c of jsonArray || []) {
		const els = Array.isArray(c?.data?.elements) ? c.data.elements : [];
		const reEls = [];
		for (const el of els) reEls.push(await rehydrateEl(el));

		let bg = c?.data?.backgroundImage || null;
		if (bg && typeof bg === 'object') {
			const { file, fileUrl, objectUrl: _oldObj, src: _oldSrc, ...bgClean } = bg;
			if (bg?.inlineData?.dataUrl) {
				try {
					const { objectUrl } = await dataUrlToObjectUrl(bg.inlineData.dataUrl);
					urls.push(objectUrl);
					bg = withSrc(bgClean, objectUrl);
				} catch {
					bg = withSrc(bgClean, null);
				}
			} else {
				bg = withSrc(bgClean, null);
			}
		}

		out.push({
			...c,
			data: {
				...c.data,
				elements: reEls,
				backgroundImage: bg ?? null,
			},
		});
	}
	return { canvases: out, urls };
}

/* ====================== 3) SaveToStorage ====================== */
export async function SaveToStorage({ canvases, path, localKey = 'canvas.local' }) {
	const jsonSafe = await ConvertCanvasToJson(canvases);
	const json = JSON.stringify(jsonSafe, null, 2);

	if (path) {
		const storage = getStorage();
		const ref = storageRef(storage, path);
		await uploadString(ref, json, 'raw', {
			contentType: 'application/json',
			cacheControl: 'no-store',
		});
		return;
	}

	try {
		localStorage.setItem(localKey, json);
	} catch (e) {
		console.warn('[SaveToStorage] localStorage failed:', e);
	}
}

/* ====================== 4) LoadFromStorage ====================== */
export async function LoadFromStorage({ path, localKey = 'canvas.local', fallback = [] }) {
	let parsed = null;

	if (path) {
		const storage = getStorage();
		const ref = storageRef(storage, path);

		try {
			const url = await getDownloadURL(ref);
			const res = await fetch(`${url}&cb=${Date.now()}`, { cache: 'no-store' });
			if (!res.ok) throw new Error(`HTTP ${res.status}`);
			parsed = await res.json();
		} catch (e) {
			try {
				const blob = await getBlob(ref);
				const text = await blob.text();
				parsed = JSON.parse(text);
			} catch {
				parsed = null;
			}
		}
	} else {
		try {
			const raw = localStorage.getItem(localKey);
			parsed = raw ? JSON.parse(raw) : null;
		} catch {
			parsed = null;
		}
	}

	const jsonArray = Array.isArray(parsed) ? parsed : parsed?.canvases || fallback || [];
	return ConvertJsonToCanvas(jsonArray);
}

/* ====================== revoke util ====================== */
export function RevokeObjectUrls(urls) {
	(urls || []).forEach((u) => {
		try {
			URL.revokeObjectURL(u);
		} catch {}
	});
}
