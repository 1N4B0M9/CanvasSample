import React, { createContext, useContext, useState, useCallback } from 'react';

// Create context
const CanvasDataContext = createContext(null);

// Custom hook to use the canvas data context
export const useCanvasData = () => {
	const context = useContext(CanvasDataContext);
	if (!context) {
		throw new Error('useCanvasData must be used within a CanvasDataProvider');
	}
	return context;
};

// Canvas data provider component
export const CanvasDataProvider = ({ children, initialCanvases = [] }) => {
	const [canvases, setCanvases] = useState(initialCanvases);
	const [nextId, setNextId] = useState(
		initialCanvases.length > 0 ? Math.max(...initialCanvases.map((canvas) => canvas.id)) + 1 : 0,
	);

	// Add a new canvas
	const addCanvas = useCallback(() => {
		const newCanvas = {
			id: nextId,
			name: `Canvas ${nextId + 1}`,
			data: {
				elements: [],
				connections: [],
			},
		};

		setCanvases((prev) => [...prev, newCanvas]);
		setNextId((prev) => prev + 1);

		return newCanvas.id;
	}, [nextId]);

	// Remove a canvas
	const removeCanvas = useCallback((id) => {
		setCanvases((prev) => prev.filter((canvas) => canvas.id !== id));
	}, []);

	// Update canvas data
	const updateCanvas = useCallback((id, data) => {
		setCanvases((prev) => prev.map((canvas) => (canvas.id === id ? { ...canvas, data } : canvas)));
	}, []);

	// Rename a canvas
	const renameCanvas = useCallback((id, name) => {
		setCanvases((prev) => prev.map((canvas) => (canvas.id === id ? { ...canvas, name } : canvas)));
	}, []);

	// Context value
	const value = {
		canvases,
		addCanvas,
		removeCanvas,
		updateCanvas,
		renameCanvas,
	};

	return <CanvasDataContext.Provider value={value}>{children}</CanvasDataContext.Provider>;
};

export default CanvasDataContext;
