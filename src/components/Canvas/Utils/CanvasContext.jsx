/**
 * CanvasContext.js - Programmatic Canvas Export
 *
 * This version creates a canvas programmatically by drawing elements directly,
 * avoiding screen capture issues entirely.
 */

/**
 * Canvas Save/Load Feature
 *
 * This file includes functions to save the canvas state as JSON and load it back.
 * The JSON format preserves all element properties, connections, arrows, and background settings
 * so that the canvas can be fully restored with all elements still draggable and editable.
 */

import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import { useCanvasData } from './CanvasDataContext';
import useElementOperations from './useElementOperations';
import useConnectionOperations from './useConnectionOperations';
import { ConvertCanvasToJson, ConvertJsonToCanvas } from './CanvasIO';

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
	const [backgroundImage, setBackgroundImage] = useState(null);
	const [backgroundScale, setBackgroundScale] = useState(100);
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

			if (canvas.data.backgroundImage) {
				setBackgroundImage(canvas.data.backgroundImage);
			}

			if (canvas.data.backgroundScale !== undefined) {
				setBackgroundScale(canvas.data.backgroundScale);
			}
		}
	}, [canvasId, canvasDataContext]);

	// Save to CanvasDataContext whenever data changes
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
				backgroundImage,
				backgroundScale,
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
	}, [elements, connections, arrows, backgroundImage, backgroundScale, canvasId, updateCanvas]);

	// Create enhanced versions of setters that ensure updates are saved
	const setElementsWithSave = useCallback((newElementsOrFn) => {
		setElements(newElementsOrFn);
	}, []);

	const setConnectionsWithSave = useCallback((newConnectionsOrFn) => {
		setConnections(newConnectionsOrFn);
	}, []);

	const setArrowsWithSave = useCallback((newArrowsOrFn) => {
		setArrows(newArrowsOrFn);
	}, []);

	// Background image operations
	const updateBackgroundImage = useCallback((imageData) => {
		setBackgroundImage(imageData);
		// Reset scale when new background is set
		setBackgroundScale(100);
	}, []);

	const removeBackgroundImage = useCallback(() => {
		setBackgroundImage(null);
		setBackgroundScale(100);
	}, []);

	const updateBackgroundScale = useCallback((scale) => {
		setBackgroundScale(scale);
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

	// Create an enhanced version of addTextElement that centers elements
	const addTextElement = useCallback(
		(x, y) => {
			// If x and y are not provided, use the center of the canvas
			if (x === undefined || y === undefined) {
				if (canvasRef.current) {
					const canvasRect = canvasRef.current.getBoundingClientRect();
					x = canvasRect.width / 2;
					y = canvasRect.height / 2;
				} else {
					// Fallback values if canvas ref isn't available
					x = window.innerWidth / 2;
					y = window.innerHeight / 2;
				}
			}

			if (elementOps && elementOps.addTextElement) {
				return elementOps.addTextElement(x, y);
			}
			return null;
		},
		[elementOps, canvasRef],
	);

	const connectionOps = useConnectionOperations(
		elements,
		connections,
		setConnectionsWithSave,
		selectedConnectionId,
		setSelectedConnectionId,
	);

	/**
	 * Add a local image from file upload with screen-fitting dimensions
	 */
	const addImageElement = useCallback(
		(file, x, y) => {
			if (!file) {
				console.error('No file provided to addImageElement');
				return null;
			}

			console.log('Adding image from file:', file.name, file.type);

			// If x and y are not provided, use the center of the canvas
			if (x === undefined || y === undefined) {
				if (canvasRef.current) {
					const canvasRect = canvasRef.current.getBoundingClientRect();
					x = canvasRect.width / 2;
					y = canvasRect.height / 2;
				} else {
					// Fallback values if canvas ref isn't available
					x = window.innerWidth / 2;
					y = window.innerHeight / 2;
				}
			}

			// Calculate screen-fitting dimensions
			const maxWidth = window.innerWidth * 0.3; // 30% of screen width
			const maxHeight = window.innerHeight * 0.3; // 30% of screen height

			const newElement = {
				id: `image-${Date.now()}`,
				type: 'image',
				file,
				alt: file.name || 'Uploaded image',
				x,
				y,
				width: Math.min(300, maxWidth), // Responsive width
				height: Math.min(200, maxHeight), // Responsive height
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

			// Add the element to the canvas immediately with the responsive dimensions
			setElementsWithSave((prevElements) => [...prevElements, newElement]);
			setSelectedId(newElement.id);
			return newElement.id;
		},
		[setElementsWithSave, setSelectedId],
	);

	// For addImageFromSearch with screen-fitting dimensions
	const addImageFromSearch = useCallback(
		(imageData, x, y) => {
			console.log('Adding Unsplash image to canvas:', imageData);

			if (!imageData || !imageData.url) {
				console.error('Invalid image data received:', imageData);
				return null;
			}

			// If x and y are not provided, use the center of the canvas
			if (x === undefined || y === undefined) {
				if (canvasRef.current) {
					const canvasRect = canvasRef.current.getBoundingClientRect();
					x = canvasRect.width / 2;
					y = canvasRect.height / 2;
				} else {
					// Fallback values if canvas ref isn't available
					x = window.innerWidth / 2;
					y = window.innerHeight / 2;
				}
			}

			// Calculate screen-fitting dimensions
			const maxWidth = window.innerWidth * 0.3; // 30% of screen width
			const maxHeight = window.innerHeight * 0.3; // 30% of screen height

			// Create element with responsive dimensions
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
				width: Math.min(300, maxWidth), // Responsive width
				height: Math.min(200, maxHeight), // Responsive height
				rotation: 0,
				scale: 1,
			};

			console.log('Created Unsplash image element:', newElement);

			// Add directly to canvas with responsive dimensions
			setElementsWithSave((prevElements) => [...prevElements, newElement]);
			setSelectedId(newElement.id);
			return newElement.id;
		},
		[setElementsWithSave, setSelectedId],
	);

	// Add a new mentor element
	const addMentorElement = useCallback(
		(x = 100, y = 100) => {
			// Calculate responsive dimensions for mentor elements
			const maxWidth = window.innerWidth * 0.25; // 25% of screen width
			const maxHeight = window.innerHeight * 0.35; // 35% of screen height

			const newElement = {
				id: `mentor-${Date.now()}`,
				type: 'mentor',
				content: 'Double-click to edit mentor content',
				image: null,
				x,
				y,
				width: Math.min(200, maxWidth),
				height: Math.min(250, maxHeight),
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

	// Helper function to calculate element center for connections
	const getElementCenter = useCallback((element) => {
		const finalScale = element.scale || 1;
		const actualWidth = (element.width || 100) * finalScale;
		const actualHeight = (element.height || 100) * finalScale;

		return {
			x: element.x + actualWidth / 2,
			y: element.y + actualHeight / 2,
		};
	}, []);

	// Helper function to load image
	const loadImage = useCallback(
		(src) =>
			new Promise((resolve, reject) => {
				const img = new Image();
				img.crossOrigin = 'anonymous';
				img.onload = () => resolve(img);
				img.onerror = reject;
				img.src = src;
			}),
		[],
	);

	/**
	 * Helper function to convert a blob URL or file to base64 data URL
	 *
	 * @param {string} url - The blob URL or object URL to convert
	 * @returns {Promise<string>} - Promise that resolves to base64 data URL
	 *
	 * Why we need this:
	 * - Object URLs (blob:https://...) are temporary and only exist in the current browser session
	 * - When we save the canvas, we need to convert these to base64 so they can be stored
	 * - Base64 data URLs are self-contained and can be saved in JSON files
	 */
	const convertBlobUrlToBase64 = useCallback(
		(url) =>
			new Promise((resolve, reject) => {
				// Fetch the blob from the object URL
				fetch(url)
					.then((response) => response.blob())
					.then((blob) => {
						// Use FileReader to convert blob to base64
						const reader = new FileReader();
						reader.onloadend = () => {
							resolve(reader.result); // This will be a base64 data URL
						};
						reader.onerror = reject;
						reader.readAsDataURL(blob);
					})
					.catch(reject);
			}),
		[],
	);

	const exportCanvasAsJSON = useCallback(
		async (fileName = 'canvas-export.json') => {
			try {
				// Wrap current canvas into an array the IO layer expects
				const canvasesToExport = [
					{
						id: typeof canvasId !== 'undefined' ? canvasId : 0, // optional: use your real id if you have it
						data: {
							elements, // your current elements state
							connections, // your current connections state
							arrows, // your current arrows state
							backgroundImage, // { inlineData:{dataUrl,...} } or blob/objectUrl/File handled by IO
							backgroundScale, // keep any other fields you need
						},
					},
				];

				// Let the IO layer do all serialization (inlines images to base64 where needed)
				const jsonSafeArray = await ConvertCanvasToJson(canvasesToExport);

				// Add a small metadata wrapper (versioning + date + future-proof list)
				const payload = {
					version: '1.0',
					exportDate: new Date().toISOString(),
					canvases: jsonSafeArray,
				};

				const jsonString = JSON.stringify(payload, null, 2);
				const blob = new Blob([jsonString], { type: 'application/json' });

				const link = document.createElement('a');
				link.href = URL.createObjectURL(blob);
				link.download = fileName;
				document.body.appendChild(link);
				link.click();
				document.body.removeChild(link);
				URL.revokeObjectURL(link.href);

				console.log('Canvas exported via IO successfully');
				return true;
			} catch (error) {
				console.error('Failed to export canvas via IO:', error);
				alert('Failed to export canvas. See console for details.');
				return false;
			}
		},
		[elements, connections, arrows, backgroundImage, backgroundScale, canvasId],
	);

	/**
	 * Import canvas from JSON file
	 *
	 * This function loads a previously exported canvas JSON file and restores
	 * the complete canvas state, making all elements draggable and editable again.
	 *
	 * @param {File} file - The JSON file to import
	 * @returns {Promise<boolean>} - Success status
	 *
	 * What gets restored:
	 * - All elements with their exact positions and properties
	 * - All connections and arrows
	 * - Background image and scale
	 *
	 * Image handling:
	 * - Base64 data URLs are converted back to blob URLs for better performance
	 * - Regular URLs (Unsplash) are used as-is
	 */
	const importCanvasFromJSON = useCallback(
		async (file) => {
			try {
				// 1) Read file
				const fileText = await new Promise((resolve, reject) => {
					const reader = new FileReader();
					reader.onload = (e) => resolve(e.target.result);
					reader.onerror = reject;
					reader.readAsText(file);
				});

				// 2) Parse + normalize to array the IO understands
				const parsed = JSON.parse(fileText);

				let jsonArray;
				if (Array.isArray(parsed)) {
					// already an array of canvases
					jsonArray = parsed;
				} else if (parsed && Array.isArray(parsed.canvases)) {
					// new wrapped export format
					jsonArray = parsed.canvases;
				} else if (parsed && Array.isArray(parsed.elements)) {
					// legacy single-canvas shape -> wrap in new shape
					jsonArray = [
						{
							id: 0,
							name: parsed.name || 'Imported',
							data: {
								elements: parsed.elements || [],
								connections: parsed.connections || [],
								arrows: parsed.arrows || [],
								backgroundImage: parsed.backgroundImage || null,
								backgroundScale: parsed.backgroundScale,
							},
						},
					];
				} else {
					throw new Error('Invalid canvas file: unrecognized structure');
				}

				// 3) Let IO layer rehydrate images (base64 -> blob URLs)
				const { canvases: hydrated } = await ConvertJsonToCanvas(jsonArray);

				// 4) Take the first canvas (or bail if none)
				const first = hydrated[0];
				if (!first?.data) throw new Error('No canvas data found in file');

				const d = first.data;

				// 5) Apply to state
				setElements(Array.isArray(d.elements) ? d.elements : []);
				setConnections(Array.isArray(d.connections) ? d.connections : []);
				setArrows(Array.isArray(d.arrows) ? d.arrows : []);
				setBackgroundImage(d.backgroundImage || null);
				setBackgroundScale(typeof d.backgroundScale === 'number' ? d.backgroundScale : 100);

				// clear selections
				setSelectedId(null);
				setSelectedConnectionId(null);
				setSelectedArrowId(null);

				console.log('Canvas imported successfully');
				return true;
			} catch (error) {
				console.error('Failed to import canvas:', error);
				alert(`Failed to import canvas: ${error.message}`);
				return false;
			}
		},
		[
			setElements,
			setConnections,
			setArrows,
			setBackgroundImage,
			setBackgroundScale,
			setSelectedId,
			setSelectedConnectionId,
			setSelectedArrowId,
		],
	);

	// PROGRAMMATIC CANVAS EXPORT - DRAWS ELEMENTS DIRECTLY
	const exportCanvas = useCallback(
		async (fileName = 'vision-board.png') => {
			if (!canvasRef.current) {
				console.error('Canvas ref not available');
				return;
			}

			try {
				console.log('Starting programmatic canvas export...');

				// Get canvas dimensions
				const canvasRect = canvasRef.current.getBoundingClientRect();
				const exportWidth = Math.floor(canvasRect.width);
				const exportHeight = Math.floor(canvasRect.height);

				console.log('Export dimensions:', exportWidth, 'x', exportHeight);

				// Create export canvas
				const exportCanvas = document.createElement('canvas');
				const ctx = exportCanvas.getContext('2d');

				// Set high resolution
				const scale = 2;
				exportCanvas.width = exportWidth * scale;
				exportCanvas.height = exportHeight * scale;
				ctx.scale(scale, scale);

				// Always start with white background
				ctx.fillStyle = '#ffffff';
				ctx.fillRect(0, 0, exportWidth, exportHeight);

				// Set background image on top if exists
				if (backgroundImage) {
					try {
						console.log('Loading background image...');
						const bgImg = await loadImage(backgroundImage.url);

						// Calculate background size with scale
						const scaleDecimal = backgroundScale / 100;
						const bgWidth = exportWidth * scaleDecimal;
						const bgHeight = exportHeight * scaleDecimal;
						const bgX = (exportWidth - bgWidth) / 2;
						const bgY = (exportHeight - bgHeight) / 2;

						ctx.drawImage(bgImg, bgX, bgY, bgWidth, bgHeight);
						console.log('Background image drawn over white background');
					} catch (error) {
						console.warn('Failed to load background image:', error);
						// White background is already set above
					}
				}

				// Draw connections first (so they appear behind elements)
				console.log('Drawing connections...');
				for (const connection of connections) {
					const startElement = elements.find((el) => el.id === connection.startId);
					const endElement = elements.find((el) => el.id === connection.endId);

					if (startElement && endElement) {
						const startCenter = getElementCenter(startElement);
						const endCenter = getElementCenter(endElement);

						ctx.strokeStyle = connection.color || '#000000';
						ctx.lineWidth = connection.thickness || 2;
						ctx.beginPath();
						ctx.moveTo(startCenter.x, startCenter.y);
						ctx.lineTo(endCenter.x, endCenter.y);
						ctx.stroke();

						// Draw connection endpoints
						ctx.fillStyle = connection.color || '#000000';
						ctx.beginPath();
						ctx.arc(startCenter.x, startCenter.y, 3, 0, 2 * Math.PI);
						ctx.fill();
						ctx.beginPath();
						ctx.arc(endCenter.x, endCenter.y, 3, 0, 2 * Math.PI);
						ctx.fill();
					}
				}

				// Draw arrows
				console.log('Drawing arrows...');
				for (const arrow of arrows) {
					const startElement = elements.find((el) => el.id === arrow.startId);
					const endElement = elements.find((el) => el.id === arrow.endId);

					if (startElement && endElement) {
						const startCenter = getElementCenter(startElement);
						const endCenter = getElementCenter(endElement);

						// Draw arrow line
						ctx.strokeStyle = arrow.color || '#000000';
						ctx.lineWidth = arrow.thickness || 2;
						ctx.beginPath();
						ctx.moveTo(startCenter.x, startCenter.y);
						ctx.lineTo(endCenter.x, endCenter.y);
						ctx.stroke();

						// Draw arrowhead
						const angle = Math.atan2(endCenter.y - startCenter.y, endCenter.x - startCenter.x);
						const arrowLength = 14;
						const arrowAngle = Math.PI / 6;

						ctx.fillStyle = arrow.color || '#000000';
						ctx.beginPath();
						ctx.moveTo(endCenter.x, endCenter.y);
						ctx.lineTo(
							endCenter.x - arrowLength * Math.cos(angle - arrowAngle),
							endCenter.y - arrowLength * Math.sin(angle - arrowAngle),
						);
						ctx.lineTo(
							endCenter.x - arrowLength * Math.cos(angle + arrowAngle),
							endCenter.y - arrowLength * Math.sin(angle + arrowAngle),
						);
						ctx.closePath();
						ctx.fill();
					}
				}

				// Draw elements
				console.log('Drawing elements...');
				for (const element of elements) {
					const finalScale = element.scale || 1;
					const rotation = ((element.rotation || 0) * Math.PI) / 180;

					ctx.save();

					// Apply transformations
					const centerX = element.x + (element.width * finalScale) / 2;
					const centerY = element.y + (element.height * finalScale) / 2;

					ctx.translate(centerX, centerY);
					ctx.rotate(rotation);
					ctx.scale(finalScale, finalScale);
					ctx.translate(-element.width / 2, -element.height / 2);

					if (element.type === 'text') {
						// Draw text element
						ctx.fillStyle = element.color || '#000000';
						ctx.font = `${element.fontSize || 16}px ${element.fontFamily || 'Arial'}`;

						// Handle multi-line text
						const lines = (element.content || 'Text').split('\n');
						const lineHeight = (element.fontSize || 16) * 1.2;

						lines.forEach((line, index) => {
							ctx.fillText(line, 8, 24 + index * lineHeight);
						});
					} else if (element.type === 'image') {
						// Draw image element
						try {
							const imageSrc = element.fileUrl || element.src;
							if (imageSrc) {
								const img = await loadImage(imageSrc);
								ctx.drawImage(img, 0, 0, element.width, element.height);
							}
						} catch (error) {
							console.warn('Failed to load element image:', error);
							// Draw placeholder
							ctx.fillStyle = '#f0f0f0';
							ctx.fillRect(0, 0, element.width, element.height);
							ctx.strokeStyle = '#ccc';
							ctx.strokeRect(0, 0, element.width, element.height);
							ctx.fillStyle = '#666';
							ctx.font = '14px Arial';
							ctx.fillText('Image', 8, element.height / 2);
						}
					} else if (element.type === 'mentor') {
						// Draw mentor element background
						ctx.fillStyle = '#ffffff';
						ctx.fillRect(0, 0, element.width, element.height);
						ctx.strokeStyle = '#e0e0e0';
						ctx.strokeRect(0, 0, element.width, element.height);

						// Draw mentor image if exists
						if (element.image) {
							try {
								const img = await loadImage(element.image);
								const imgHeight = element.height * 0.6;
								ctx.drawImage(img, 8, 8, element.width - 16, imgHeight);
							} catch (error) {
								console.warn('Failed to load mentor image:', error);
							}
						}

						// Draw mentor text
						ctx.fillStyle = element.color || '#000000';
						ctx.font = `${element.fontSize || 16}px ${element.fontFamily || 'Arial'}`;

						const textY = element.image ? element.height * 0.7 : 24;
						const lines = (element.content || 'Mentor').split('\n');
						const lineHeight = (element.fontSize || 16) * 1.2;

						lines.forEach((line, index) => {
							ctx.fillText(line, 8, textY + index * lineHeight);
						});
					}

					ctx.restore();
				}

				console.log('Canvas drawing completed');

				// Create download
				const link = document.createElement('a');
				link.download = fileName;
				link.href = exportCanvas.toDataURL('image/png', 1.0);

				document.body.appendChild(link);
				link.click();
				document.body.removeChild(link);

				console.log('Export completed successfully:', fileName);
			} catch (error) {
				console.error('Programmatic export failed:', error);

				// Simple fallback
				try {
					const rect = canvasRef.current.getBoundingClientRect();
					const fallbackCanvas = document.createElement('canvas');
					const ctx = fallbackCanvas.getContext('2d');

					fallbackCanvas.width = Math.max(rect.width, 800);
					fallbackCanvas.height = Math.max(rect.height, 600);

					ctx.fillStyle = '#ffffff';
					ctx.fillRect(0, 0, fallbackCanvas.width, fallbackCanvas.height);

					ctx.fillStyle = '#000000';
					ctx.font = '24px Arial';
					ctx.textAlign = 'center';
					ctx.fillText('Vision Board Export', fallbackCanvas.width / 2, fallbackCanvas.height / 2 - 20);
					ctx.font = '16px Arial';
					ctx.fillText(
						'Programmatic export failed - basic version',
						fallbackCanvas.width / 2,
						fallbackCanvas.height / 2 + 10,
					);
					ctx.fillText(
						`Elements: ${elements.length}, Connections: ${connections.length}`,
						fallbackCanvas.width / 2,
						fallbackCanvas.height / 2 + 40,
					);

					const link = document.createElement('a');
					link.download = fileName;
					link.href = fallbackCanvas.toDataURL('image/png');
					document.body.appendChild(link);
					link.click();
					document.body.removeChild(link);
				} catch (fallbackError) {
					console.error('All export methods failed:', fallbackError);
					alert('Export failed. Please check console for details.');
				}
			}
		},
		[backgroundImage, backgroundScale, elements, connections, arrows, getElementCenter, loadImage],
	);

	// Context value
	const value = {
		// State
		canvasId,
		elements,
		connections,
		arrows,
		backgroundImage,
		backgroundScale,
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
		addTextElement,
		addImageElement,
		updateElement: elementOps?.updateElement,
		updateElementSize: elementOps?.updateElementSize,
		deleteElement: elementOps?.deleteElement,
		handleScaleStart: elementOps?.handleScaleStart,
		handleElementMouseDown: elementOps?.handleElementMouseDown,
		handleElementMouseMove: elementOps?.handleElementMouseMove,
		handleElementMouseUp: elementOps?.handleElementMouseUp,
		handleElementWheel: elementOps?.handleElementWheel,

		// New mentor and image search operations
		addMentorElement,
		addImageFromSearch,

		// Background operations
		updateBackgroundImage,
		removeBackgroundImage,
		updateBackgroundScale,

		// Export operations
		exportCanvas,
		exportCanvasAsJSON,
		importCanvasFromJSON,

		// Connection operations
		createConnection: connectionOps?.createConnection,
		deleteConnection: connectionOps?.deleteConnection,
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
