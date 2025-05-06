/**
 * CanvasContext Integration with CanvasDataContext
 *
 * This module updates the CanvasContext to sync data with the parent CanvasDataContext
 * to ensure elements and connections are saved to Firestore.
 */

import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import { useCanvasData } from './CanvasDataContext';
import useElementOperations from './useElementOperations';
import useConnectionOperations from './useConnectionOperations';

// Create context
const CanvasContext = createContext(null);

// Custom hook to use the canvas context
export const useCanvas = () => {
	const context = useContext(CanvasContext);
	if (!context) {
		throw new Error('useCanvas must be used within a CanvasProvider');
	}
	return context;
};

// Canvas provider component
export const CanvasProvider = ({ children, canvasId }) => {
	// Get the canvasData context to sync with Firestore
	const canvasDataContext = useCanvasData();
	const { updateCanvas } = canvasDataContext;

	// State
	const [elements, setElements] = useState([]);
	const [connections, setConnections] = useState([]);
	const [arrows, setArrows] = useState([]);
	const [selectedId, setSelectedId] = useState(null);
	const [selectedConnectionId, setSelectedConnectionId] = useState(null);
	const [selectedArrowId, setSelectedArrowId] = useState(null);
	const [isConnecting, setIsConnecting] = useState(false);
	const [isCreatingArrow, setIsCreatingArrow] = useState(false);
	const [connectionStart, setConnectionStart] = useState(null);
	const [arrowStart, setArrowStart] = useState(null);
	const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

	// Refs
	const canvasRef = useRef(null);
	const saveTimeoutRef = useRef(null);

	// Load canvas data from CanvasDataContext on mount
	useEffect(() => {
		const { canvases } = canvasDataContext;
		const canvas = canvases.find((c) => c.id === canvasId);

		if (canvas && canvas.data) {
			if (canvas.data.elements) {
				setElements(canvas.data.elements);
			}

			if (canvas.data.connections) {
				setConnections(canvas.data.connections);
			}

			if (canvas.data.arrows) {
				setArrows(canvas.data.arrows);
			}
		}
	}, [canvasId, canvasDataContext]);

	// Save to CanvasDataContext whenever elements, connections, or arrows change
	useEffect(() => {
		// Clear any existing timeout
		if (saveTimeoutRef.current) {
			clearTimeout(saveTimeoutRef.current);
		}

		// Set a new timeout to debounce saves
		saveTimeoutRef.current = setTimeout(() => {
			const canvasData = {
				elements,
				connections,
				arrows,
			};

			console.log('Saving canvas data:', canvasData);
			updateCanvas(canvasId, canvasData);
		}, 500); // 500ms debounce

		// Clean up the timeout on unmount
		return () => {
			if (saveTimeoutRef.current) {
				clearTimeout(saveTimeoutRef.current);
			}
		};
	}, [elements, connections, arrows, canvasId, updateCanvas]);

	// Create enhanced versions of setElements and setConnections that ensure updates are saved
	const setElementsWithSave = useCallback((newElementsOrFn) => {
		// Handle both direct value and function updater pattern
		setElements(newElementsOrFn);
	}, []);

	const setConnectionsWithSave = useCallback((newConnectionsOrFn) => {
		// Handle both direct value and function updater pattern
		setConnections(newConnectionsOrFn);
	}, []);

	const setArrowsWithSave = useCallback((newArrowsOrFn) => {
		// Handle both direct value and function updater pattern
		setArrows(newArrowsOrFn);
	}, []);

	// Custom hooks for operations with enhanced setters
	const elementOps = useElementOperations(
		elements,
		setElementsWithSave,
		selectedId,
		setSelectedId,
		connections,
		setConnectionsWithSave,
	);

	const connectionOps = useConnectionOperations(
		elements,
		connections,
		setConnectionsWithSave,
		selectedConnectionId,
		setSelectedConnectionId,
	);

	/**
	 * Add a local image from file upload
	 */
	const addImageElement = useCallback(
		(file, x = 100, y = 100) => {
			if (!file) {
				console.error('No file provided to addImageElement');
				return null;
			}

			console.log('Adding image from file:', file.name, file.type);

			// Use small fixed dimensions to guarantee images don't overwhelm the canvas
			const newElement = {
				id: `image-${Date.now()}`,
				type: 'image',
				file,
				alt: file.name || 'Uploaded image',
				x,
				y,
				width: 250, // Smaller fixed width
				height: 150, // Smaller fixed height
				rotation: 0,
				scale: 1,
			};

			try {
				// Create a URL for the file - this is the most reliable method
				const fileUrl = URL.createObjectURL(file);
				newElement.fileUrl = fileUrl;
				console.log('Created fileUrl:', fileUrl);
			} catch (error) {
				console.error('Error creating object URL:', error);
			}

			console.log('Created image element:', newElement);

			// Add the element to the canvas immediately with the guaranteed dimensions
			setElementsWithSave((prevElements) => [...prevElements, newElement]);
			setSelectedId(newElement.id);
			return newElement.id;
		},
		[setElementsWithSave, setSelectedId],
	);

	// For addImageFromSearch
	const addImageFromSearch = useCallback(
		(imageData, x = 100, y = 100) => {
			console.log('Adding Unsplash image to canvas:', imageData);

			if (!imageData || !imageData.url) {
				console.error('Invalid image data received:', imageData);
				return null;
			}

			// Create element with guaranteed small dimensions
			const newElement = {
				id: `image-${Date.now()}`,
				type: 'image',
				src: imageData.url,
				alt: imageData.title || 'Unsplash image',
				attribution: {
					photographer: imageData.photographer || 'Unknown',
					photographerUrl: imageData.photographerUrl || '',
				},
				x,
				y,
				width: 250, // Smaller fixed width
				height: 150, // Smaller fixed height
				rotation: 0,
				scale: 1,
			};

			console.log('Created Unsplash image element:', newElement);

			// Add directly to canvas with guaranteed dimensions
			setElementsWithSave((prevElements) => [...prevElements, newElement]);
			setSelectedId(newElement.id);
			return newElement.id;
		},
		[setElementsWithSave, setSelectedId],
	);

	// Add a new mentor element
	const addMentorElement = useCallback(
		(x = 100, y = 100) => {
			const newElement = {
				id: `mentor-${Date.now()}`,
				type: 'mentor',
				content: 'Double-click to edit mentor content',
				image: null,
				x,
				y,
				width: 200,
				height: 250,
				rotation: 0,
				scale: 1,
				fontSize: 16,
				fontFamily: 'Arial',
				color: '#000000',
			};

			setElementsWithSave((prevElements) => [...prevElements, newElement]);
			setSelectedId(newElement.id);
			return newElement.id;
		},
		[setElementsWithSave],
	);

	// Handle selection
	const handleSelect = useCallback((id) => {
		setSelectedId(id);
		setSelectedConnectionId(null);
	}, []);

	// Handle connection selection
	const handleConnectionSelect = useCallback(
		(id, e) => {
			e.stopPropagation();

			if (selectedConnectionId === id) {
				setSelectedConnectionId(null);
			} else {
				setSelectedId(null);
				setSelectedConnectionId(id);
			}
		},
		[selectedConnectionId],
	);

	// Start a connection from an element
	const handleStartConnection = useCallback(
		(elementId) => {
			const element = elements.find((el) => el.id === elementId);
			if (!element) return;

			setIsConnecting(true);
			setConnectionStart({
				id: elementId,
				element,
			});
		},
		[elements],
	);

	// Complete a connection to another element
	const handleCompleteConnection = useCallback(
		(endElementId) => {
			if (!isConnecting || !connectionStart || connectionStart.id === endElementId) {
				setIsConnecting(false);
				setConnectionStart(null);
				return;
			}

			try {
				if (connectionOps && typeof connectionOps.createConnection === 'function') {
					connectionOps.createConnection(connectionStart.id, endElementId);
				} else {
					console.error('createConnection is not available');
				}
			} catch (error) {
				console.error('Error creating connection:', error);
			}

			setIsConnecting(false);
			setConnectionStart(null);
		},
		[isConnecting, connectionStart, connectionOps],
	);

	// Toggle connection mode
	const toggleConnectionMode = useCallback(() => {
		setIsConnecting((prevState) => {
			if (prevState) {
				setConnectionStart(null);
				return false;
			}
			setConnectionStart({
				id: null,
				element: null,
			});
			return true;
		});
	}, []);

	// Update mouse position
	const updateMousePosition = useCallback((x, y) => {
		setMousePosition({ x, y });
	}, []);

	// Reset selection
	const resetSelection = useCallback(() => {
		// For debugging
		console.log('Resetting all selections');

		// Clear any element selections
		setSelectedId(null);

		// Clear any connection selections
		setSelectedConnectionId(null);

		// Clear any arrow selections
		setSelectedArrowId(null);

		// Also cancel any connection or arrow creation mode
		if (isConnecting) {
			setIsConnecting(false);
			setConnectionStart(null);
		}

		if (isCreatingArrow) {
			setIsCreatingArrow(false);
			setArrowStart(null);
		}
	}, [isConnecting, isCreatingArrow]);

	// Handle arrow selection
	const handleArrowSelect = useCallback(
		(id, e) => {
			e.stopPropagation();

			if (selectedArrowId === id) {
				setSelectedArrowId(null);
			} else {
				setSelectedId(null);
				setSelectedConnectionId(null);
				setSelectedArrowId(id);
			}
		},
		[selectedArrowId],
	);

	// Start creating an arrow from an element
	const handleStartArrow = useCallback(
		(elementId) => {
			const element = elements.find((el) => el.id === elementId);
			if (!element) return;

			setIsCreatingArrow(true);
			setArrowStart({
				id: elementId,
				element,
			});
		},
		[elements],
	);

	// Complete an arrow to another element
	const handleCompleteArrow = useCallback(
		(endElementId) => {
			if (!isCreatingArrow || !arrowStart || arrowStart.id === endElementId) {
				setIsCreatingArrow(false);
				setArrowStart(null);
				return;
			}

			// Create new arrow
			const newArrow = {
				id: `arrow-${Date.now()}`,
				startId: arrowStart.id,
				endId: endElementId,
				type: 'arrow',
				color: 'black',
				thickness: 2,
			};

			setArrowsWithSave((prev) => [...prev, newArrow]);

			setIsCreatingArrow(false);
			setArrowStart(null);
		},
		[isCreatingArrow, arrowStart, setArrowsWithSave],
	);

	// Delete an arrow
	const deleteArrow = useCallback(
		(arrowId) => {
			console.log('Deleting arrow with ID:', arrowId);
			setArrowsWithSave((prev) => prev.filter((arrow) => arrow.id !== arrowId));
			setSelectedArrowId(null);
		},
		[setArrowsWithSave],
	);

	// Toggle arrow creation mode
	const toggleArrowMode = useCallback(() => {
		setIsCreatingArrow((prevState) => {
			if (prevState) {
				setArrowStart(null);
				return false;
			}
			setArrowStart({
				id: null,
				element: null,
			});
			return true;
		});

		// Turn off other modes if they're active
		if (isConnecting) {
			setIsConnecting(false);
			setConnectionStart(null);
		}
	}, [isConnecting]);

	// Safely get connection coordinates
	const getConnectionCoordinates = useCallback(
		(connection) => {
			try {
				if (connectionOps && typeof connectionOps.getConnectionCoordinates === 'function') {
					return connectionOps.getConnectionCoordinates(connection);
				}
			} catch (error) {
				console.error('Error getting connection coordinates:', error);
			}
			return null;
		},
		[connectionOps],
	);

	// Update connection data
	const updateConnectionData = useCallback(
		(connectionId, data) => {
			setConnectionsWithSave((prev) => prev.map((conn) => (conn.id === connectionId ? { ...conn, data } : conn)));
		},
		[setConnectionsWithSave],
	);

	// Update arrow data
	const updateArrowData = useCallback(
		(arrowId, data) => {
			setArrowsWithSave((prev) => prev.map((arrow) => (arrow.id === arrowId ? { ...arrow, data } : arrow)));
		},
		[setArrowsWithSave],
	);

	// Context value
	const value = {
		// State
		canvasId,
		elements,
		connections,
		arrows,
		selectedId,
		selectedConnectionId,
		selectedArrowId,
		isConnecting,
		isCreatingArrow,
		connectionStart,
		arrowStart,
		mousePosition,
		canvasRef,

		// Element operations
		addTextElement: elementOps.addTextElement,
		addImageElement, // Use our updated function
		updateElement: elementOps.updateElement,
		updateElementSize: elementOps.updateElementSize,
		deleteElement: elementOps.deleteElement,
		handleScaleStart: elementOps.handleScaleStart,
		handleElementMouseDown: elementOps.handleElementMouseDown,
		handleElementMouseMove: elementOps.handleElementMouseMove,
		handleElementMouseUp: elementOps.handleElementMouseUp,
		handleElementWheel: elementOps.handleElementWheel,

		// New mentor and image search operations
		addMentorElement,
		addImageFromSearch,

		// Connection operations
		createConnection: connectionOps.createConnection,
		deleteConnection: connectionOps.deleteConnection,
		updateConnectionData,

		// Arrow operations
		deleteArrow,
		updateArrowData,

		// Selection handlers
		handleSelect,
		handleConnectionSelect,
		handleArrowSelect,
		resetSelection,

		// Connection mode
		handleStartConnection,
		handleCompleteConnection,
		toggleConnectionMode,

		// Arrow mode
		handleStartArrow,
		handleCompleteArrow,
		toggleArrowMode,

		// Mouse tracking
		updateMousePosition,
	};

	return <CanvasContext.Provider value={value}>{children}</CanvasContext.Provider>;
};

export default CanvasContext;
