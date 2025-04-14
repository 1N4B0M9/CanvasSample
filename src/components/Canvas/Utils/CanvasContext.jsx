/**
 * Updated CanvasContext with Mentor Element and Image Support
 */

import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
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

	// Custom hooks for operations
	const elementOps = useElementOperations(
		elements,
		setElements,
		selectedId,
		setSelectedId,
		connections,
		setConnections,
	);

	const connectionOps = useConnectionOperations(
		elements,
		connections,
		setConnections,
		selectedConnectionId,
		setSelectedConnectionId,
	);

	/**
	 * Add a local image from file upload
	 *
	 * @param {File} file - The image file to add
	 * @param {number} x - The x position on canvas
	 * @param {number} y - The y position on canvas
	 * @returns {string} The ID of the created element
	 */
	/**
	 * Fixed addImageElement function - Guaranteed to work
	 */

	// Add a local image from file upload - simple and direct implementation
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
			setElements((prevElements) => [...prevElements, newElement]);
			setSelectedId(newElement.id);
			return newElement.id;
		},
		[setElements, setSelectedId],
	);

	// For addImageFromSearch in CanvasContext.js:
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
			setElements((prevElements) => [...prevElements, newElement]);
			setSelectedId(newElement.id);
			return newElement.id;
		},
		[setElements, setSelectedId],
	);

	// Add a new mentor element
	const addMentorElement = useCallback((x = 100, y = 100) => {
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

		setElements((prevElements) => [...prevElements, newElement]);
		setSelectedId(newElement.id);
		return newElement.id;
	}, []);

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

			setArrows((prev) => [...prev, newArrow]);

			setIsCreatingArrow(false);
			setArrowStart(null);
		},
		[isCreatingArrow, arrowStart],
	);

	// Delete an arrow
	const deleteArrow = useCallback((arrowId) => {
		console.log('Deleting arrow with ID:', arrowId);
		setArrows((prev) => prev.filter((arrow) => arrow.id !== arrowId));
		setSelectedArrowId(null);
	}, []);

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
	const updateConnectionData = useCallback((connectionId, data) => {
		setConnections((prev) => prev.map((conn) => (conn.id === connectionId ? { ...conn, data } : conn)));
	}, []);

	// Update arrow data
	const updateArrowData = useCallback((arrowId, data) => {
		setArrows((prev) => prev.map((arrow) => (arrow.id === arrowId ? { ...arrow, data } : arrow)));
	}, []);

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
