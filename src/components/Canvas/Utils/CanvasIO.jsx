// src/components/Canvas/Utils/CanvasIO.js
import { getStorage, ref as storageRef, uploadString, getDownloadURL, getBlob } from 'firebase/storage';
import { getAuth } from 'firebase/auth';

const STORAGE_BUCKET = 'gs://project-rebound.appspot.com'; // <-- your bucket

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
async function serializeElement(el) {
	if (!el || typeof el !== 'object') return el;

	// NOTE: We NO LONGER strip a normal (non-"blob:") src. We only discard blob/objectUrl/file/fileUrl fields.
	const {
		file,
		blob,
		objectUrl, // strip
		fileUrl, // strip
		src, // we'll preserve if non-blob below
		...rest
	} = el;

	// Keep src if it's a regular URL or data URL (anything that's not a session-scoped blob URL).
	const keepSrc = typeof src === 'string' && !src.startsWith('blob:') ? { src } : {};

	// Keep inlineData as-is if present
	if (el?.inlineData?.dataUrl) {
		return {
			...rest,
			...keepSrc,
			inlineData: { ...el.inlineData },
		};
	}

	// If original element came from a File
	if (typeof File !== 'undefined' && file instanceof File) {
		const dataUrl = await fileToDataUrl(file);
		return {
			...rest,
			...keepSrc,
			inlineData: {
				dataUrl,
				mimeType: file.type || 'application/octet-stream',
				originalName: file.name || 'image',
				size: file.size ?? undefined,
			},
		};
	}

	// If original element came from a Blob
	if (blob instanceof Blob) {
		const dataUrl = await fileToDataUrl(blob);
		return {
			...rest,
			...keepSrc,
			inlineData: { dataUrl, mimeType: blob.type || 'application/octet-stream' },
		};
	}

	// If original element had an object URL
	if (typeof objectUrl === 'string' && objectUrl.startsWith('blob:')) {
		try {
			const res = await fetch(objectUrl);
			const b = await res.blob();
			const dataUrl = await fileToDataUrl(b);
			return {
				...rest,
				...keepSrc,
				inlineData: { dataUrl, mimeType: b.type || 'application/octet-stream' },
			};
		} catch {
			// If something fails, just return what we can with preserved src if available
			return { ...rest, ...keepSrc };
		}
	}

	// Default path: preserved non-blob src (if any), otherwise just rest
	return { ...rest, ...keepSrc };
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
export async function ConvertJsonToCanvas(jsonArray) {
	const urls = [];

	// Builds the src field by preferring objectUrl (rebuilt from inlineData), then inlineData URL,
	// then a preserved non-blob src (from JSON), and finally a fallback empty PNG.
	const withSrc = (obj, { objectUrl, inline, existingSrc } = {}) => {
		const safeExisting = typeof existingSrc === 'string' && !existingSrc.startsWith('blob:') ? existingSrc : null;

		const src = objectUrl || inline || safeExisting || EMPTY_PNG;
		const out = { ...obj, src };
		if (objectUrl) out.objectUrl = objectUrl;
		return out;
	};

	const rehydrateEl = async (el) => {
		if (!el || typeof el !== 'object') return el;

		// We drop transient fields if any snuck into JSON; keep src for non-blob only.
		const { file, fileUrl, objectUrl: _oldObj, src, ...clean } = el;

		// If there is inline data, rebuild a fresh object URL for this session.
		if (el?.inlineData?.dataUrl) {
			try {
				const { objectUrl } = await dataUrlToObjectUrl(el.inlineData.dataUrl);
				urls.push(objectUrl);
				return withSrc(clean, { objectUrl });
			} catch {
				// If rebuilding objectUrl fails, at least return inline data URL or preserved src
				return withSrc(clean, { inline: el.inlineData.dataUrl, existingSrc: src });
			}
		}

		// No inline data: keep a preserved non-blob src if present
		return withSrc(clean, { existingSrc: src });
	};

	const out = [];
	for (const c of jsonArray || []) {
		const els = Array.isArray(c?.data?.elements) ? c.data.elements : [];
		const reEls = [];
		for (const el of els) reEls.push(await rehydrateEl(el));

		let bg = c?.data?.backgroundImage || null;
		if (bg && typeof bg === 'object') {
			const { file, fileUrl, objectUrl: _oldObj, src, ...bgClean } = bg;
			if (bg?.inlineData?.dataUrl) {
				try {
					const { objectUrl } = await dataUrlToObjectUrl(bg.inlineData.dataUrl);
					urls.push(objectUrl);
					bg = withSrc(bgClean, { objectUrl });
				} catch {
					bg = withSrc(bgClean, { inline: bg.inlineData.dataUrl, existingSrc: src });
				}
			} else {
				bg = withSrc(bgClean, { existingSrc: src });
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
	console.log('[SaveToStorage] Starting Save');
	const auth = getAuth();
	console.log('[SaveToStorage] auth.currentUser:', auth.currentUser?.uid || null);

	const jsonSafe = await ConvertCanvasToJson(canvases);
	const json = JSON.stringify(jsonSafe, null, 2);

	if (path) {
		const storage = getStorage(undefined, STORAGE_BUCKET); // ← pin bucket
		const ref = storageRef(storage, path);
		await uploadString(ref, json, 'raw', {
			contentType: 'application/json',
			cacheControl: 'public,max-age=30',
		});
		console.log('[SaveToStorage] Successfully saved to cloud storage:', path);
		return;
	}

	try {
		localStorage.setItem(localKey, json);
		console.log('[SaveToStorage] Successfully saved to localStorage key:', localKey);
	} catch (e) {
		console.warn('[SaveToStorage] localStorage failed:', e);
	}
}

/* ====================== 4) LoadFromStorage ====================== */
export async function LoadFromStorage({ path, localKey = 'canvas.local', fallback = [] }) {
	let parsed = null;

	if (path) {
		const storage = getStorage(undefined, STORAGE_BUCKET); // ← pin bucket here too
		const ref = storageRef(storage, path);

		try {
			const url = await getDownloadURL(ref);
			const res = await fetch(`${url}&cb=${Date.now()}`, { cacheControl: 'public,max-age=30' });
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
