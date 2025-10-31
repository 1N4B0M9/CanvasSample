import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { doc, setDoc, getDoc, collection } from 'firebase/firestore';
import { db } from '../../../firebase/firebase'; // Ensure this path is correct

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
export const CanvasDataProvider = ({ children, initialCanvases = [], currentUser }) => {
	const [canvases, setCanvases] = useState(initialCanvases);
	const [nextId, setNextId] = useState(
		initialCanvases.length > 0 ? Math.max(...initialCanvases.map((canvas) => canvas.id)) + 1 : 0,
	);

	// Save canvases to Firestore whenever they change
	useEffect(() => {
		// Only save to Firestore if user is logged in and canvases have been initialized
		if (currentUser && canvases.length > 0) {
			const saveToFirestore = async () => {
				try {
					const canvasDocRef = doc(db, 'canvas', currentUser.uid);
					await setDoc(canvasDocRef, { canvases }, { merge: true });
					console.log('Canvas data saved to Firestore');
				} catch (error) {
					console.error('Error saving canvas data:', error);
				}
			};

			saveToFirestore();
		}
	}, [canvases, currentUser]);

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

	// Update canvas data
	const updateCanvas = useCallback((id, data) => {
		setCanvases((prev) => prev.map((canvas) => (canvas.id === id ? { ...canvas, data } : canvas)));
	}, []);

	// Update canvas name
	const updateCanvasName = useCallback((id, name) => {
		setCanvases((prev) => prev.map((canvas) => (canvas.id === id ? { ...canvas, name } : canvas)));
	}, []);

	// Delete a canvas
	const deleteCanvas = useCallback((id) => {
		setCanvases((prev) => prev.filter((canvas) => canvas.id !== id));
	}, []);

	// Context value
	const value = {
		canvases,
		addCanvas,
		updateCanvas,
		updateCanvasName,
		deleteCanvas,
		isLoggedIn: !!currentUser,
	};

	return <CanvasDataContext.Provider value={value}>{children}</CanvasDataContext.Provider>;
};

export default CanvasDataContext;
