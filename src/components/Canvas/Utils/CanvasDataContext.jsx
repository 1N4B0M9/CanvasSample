// src/components/Canvas/Utils/CanvasDataContext.jsx
import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { SaveToStorage, LoadFromStorage, ConvertJsonToCanvas, RevokeObjectUrls } from './CanvasIO';

const SAVE_DEBOUNCE_MS = 600;

const CanvasDataContext = createContext(null);

export const useCanvasData = () => {
	const ctx = useContext(CanvasDataContext);
	if (!ctx) throw new Error('useCanvasData must be used within a CanvasDataProvider');
	return ctx;
};

export const CanvasDataProvider = ({ children, initialCanvases = [], currentUser }) => {
	const [canvases, setCanvases] = useState(initialCanvases);
	const [nextId, setNextId] = useState(
		initialCanvases.length > 0 ? Math.max(...initialCanvases.map((c) => c.id)) + 1 : 0,
	);
	const [loadedFromStorage, setLoadedFromStorage] = useState(false);
	const [loading, setLoading] = useState(true);
	const [loadError, setLoadError] = useState(false); // ← NEW: track cloud load failure

	// Track blob: URLs so we can revoke them
	const urlsRef = useRef([]);

	// Where to persist
	const filePath = currentUser ? `canvas/${currentUser.uid}/canvases.json` : null;
	const localKey = 'canvas.local';

	/* ----------------------------- load helpers ----------------------------- */

	// markLoaded controls whether we set loadedFromStorage=true (enables autosave)
	const applyLoadedData = useCallback(async (jsonArray, markLoaded = true) => {
		const { canvases: hydrated, urls } = await ConvertJsonToCanvas(jsonArray);

		if (urlsRef.current?.length) RevokeObjectUrls(urlsRef.current);
		urlsRef.current = urls;

		setCanvases(hydrated);
		const maxId = hydrated.length ? Math.max(...hydrated.map((c) => c.id)) : -1;
		setNextId(maxId + 1);
		if (markLoaded) setLoadedFromStorage(true);
		setLoadError(false);
		setLoading(false);
	}, []);

	const loadFromEitherStorage = useCallback(async () => {
		try {
			const { canvases: loaded, urls } = await LoadFromStorage({
				path: filePath || null,
				localKey,
				fallback: Array.isArray(initialCanvases) ? initialCanvases : [],
			});

			if (urlsRef.current?.length) RevokeObjectUrls(urlsRef.current);
			urlsRef.current = urls;

			setCanvases(loaded);
			const maxId = loaded.length ? Math.max(...loaded.map((c) => c.id)) : -1;
			setNextId(maxId + 1);
			setLoadedFromStorage(true);
			setLoadError(false);
			setLoading(false);
		} catch (err) {
			console.warn('[Canvas] LoadFromStorage failed; falling back to initial.', err);
			setLoadError(true); // ← flag the failure
			setLoading(false);
			// Load initial/fallback but DO NOT mark as loadedFromStorage,
			// so autosave won't overwrite cloud with blank/default data.
			await applyLoadedData(Array.isArray(initialCanvases) ? initialCanvases : [], false);
		}
	}, [applyLoadedData, filePath, initialCanvases]);

	/* ----------------------------- save helpers ----------------------------- */

	const saveToEitherStorage = useCallback(
		async (data) => {
			try {
				console.log('[saveToEitherStorage] Starting Save');
				await SaveToStorage({
					canvases: data,
					path: filePath || null,
					localKey,
				});
			} catch (error) {
				console.error('[saveToEitherStorage] error:', error);
			}
		},
		[filePath],
	);

	// Debounced background save (catches non-mutator changes too)
	const saveTimer = useRef(null);
	useEffect(() => {
		if (!loadedFromStorage) return; // avoid saving before initial load (or after failed cloud load)
		if (saveTimer.current) clearTimeout(saveTimer.current);
		saveTimer.current = setTimeout(() => {
			saveToEitherStorage(canvases);
		}, SAVE_DEBOUNCE_MS);
		return () => {
			if (saveTimer.current) clearTimeout(saveTimer.current);
		};
	}, [canvases, loadedFromStorage, saveToEitherStorage]);

	// Immediate save helper used by mutators
	const immediateSave = useCallback(
		(data) => {
			if (!loadedFromStorage) return;
			Promise.resolve().then(() => saveToEitherStorage(data));
		},
		[loadedFromStorage, saveToEitherStorage],
	);

	/* --------------------------- lifecycle: load ---------------------------- */

	useEffect(() => {
		let cancelled = false;
		(async () => {
			setLoadedFromStorage(false);
			setLoadError(false);
			setLoading(true);
			await loadFromEitherStorage();
			if (cancelled) return;
		})();
		return () => {
			cancelled = true;
		};
	}, [loadFromEitherStorage, currentUser]);

	// Revoke object URLs on unmount
	useEffect(
		() => () => {
			if (urlsRef.current?.length) RevokeObjectUrls(urlsRef.current);
			urlsRef.current = [];
		},
		[],
	);

	/* ------------------------------- mutators ------------------------------- */

	const addCanvas = useCallback(() => {
		const id = nextId;
		const newCanvas = {
			id,
			name: `Canvas ${id + 1}`,
			data: { elements: [], connections: [], arrows: [] },
		};
		setCanvases((prev) => {
			const next = [...prev, newCanvas];
			immediateSave(next);
			return next;
		});
		setNextId((prev) => prev + 1);
		return id;
	}, [nextId, immediateSave]);

	const updateCanvas = useCallback(
		(id, data) => {
			setCanvases((prev) => {
				const next = prev.map((c) => (c.id === id ? { ...c, data } : c));
				immediateSave(next);
				return next;
			});
		},
		[immediateSave],
	);

	const updateCanvasName = useCallback(
		(id, name) => {
			setCanvases((prev) => {
				const next = prev.map((c) => (c.id === id ? { ...c, name } : c));
				immediateSave(next);
				return next;
			});
		},
		[immediateSave],
	);

	const deleteCanvas = useCallback(
		(id) => {
			setCanvases((prev) => {
				const next = prev.filter((c) => c.id !== id);
				immediateSave(next);
				return next;
			});
		},
		[immediateSave],
	);

	const refreshFromStorage = useCallback(() => loadFromEitherStorage(), [loadFromEitherStorage]);

	const value = {
		canvases,
		addCanvas,
		updateCanvas,
		updateCanvasName,
		deleteCanvas,
		refreshFromStorage,
		isLoggedIn: !!filePath,
		loading,
		loadError, // ← expose error flag
	};

	return <CanvasDataContext.Provider value={value}>{children}</CanvasDataContext.Provider>;
};

export default CanvasDataContext;
