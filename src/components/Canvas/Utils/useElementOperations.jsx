import { useState, useCallback, useRef } from 'react';

const useElementOperations = (elements, setElements, selectedId, setSelectedId, connections, setConnections) => {
	const [isDragging, setIsDragging] = useState(false);
	const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
	const [isScaling, setIsScaling] = useState(false);
	const scaleRef = useRef(null);

	// Add a new text element
	const addTextElement = useCallback(() => {
		const newText = {
			id: Date.now().toString(),
			type: 'text',
			content: 'Double click to edit',
			x: 100,
			y: 100,
			rotation: 0,
			scale: 1,
			fontSize: 16,
			color: 'black',
			width: 100,
			height: 50,
		};

		setElements((prev) => [...prev, newText]);
		setSelectedId(newText.id);
	}, [setElements, setSelectedId]);

	// Add a new image element
	const addImageElement = useCallback(
		(file, x, y) => {
			if (!file || !file.type.startsWith('image/')) return;

			const reader = new FileReader();
			reader.onload = (event) => {
				const newImage = {
					id: Date.now().toString(),
					type: 'image',
					content: event.target.result,
					x,
					y,
					rotation: 0,
					scale: 1,
					width: 100,
					height: 100,
				};

				setElements((prev) => [...prev, newImage]);
			};

			reader.readAsDataURL(file);
		},
		[setElements],
	);

	// Update an element's properties
	const updateElement = useCallback(
		(updatedElement) => {
			setElements((prev) => prev.map((el) => (el.id === updatedElement.id ? updatedElement : el)));

			// Force a re-render of connections
			setConnections((prev) => [...prev]);
		},
		[setElements, setConnections],
	);

	// Update element dimensions
	const updateElementSize = useCallback(
		(id, width, height) => {
			setElements((prev) => prev.map((el) => (el.id === id ? { ...el, width, height } : el)));

			// Force a re-render of connections
			setConnections((prev) => [...prev]);
		},
		[setElements, setConnections],
	);

	// Delete an element
	const deleteElement = useCallback(
		(id) => {
			// Deselect if currently selected
			if (selectedId === id) {
				setSelectedId(null);
			}

			// Remove connections involving this element
			setConnections((prev) => prev.filter((conn) => conn.startId !== id && conn.endId !== id));

			// Remove the element
			setElements((prev) => prev.filter((el) => el.id !== id));
		},
		[selectedId, setSelectedId, setConnections, setElements],
	);

	// Start scaling an element
	const handleScaleStart = useCallback((elementId, scaleInfo, event) => {
		event.preventDefault();
		event.stopPropagation();

		setIsScaling(true);
		scaleRef.current = {
			elementId,
			...scaleInfo,
		};
	}, []);

	// Handle mouse down for dragging
	const handleMouseDown = useCallback(
		(e, canvasRef) => {
			if (!canvasRef.current) return;

			if (e.target === canvasRef.current) {
				// Clicked on empty canvas - deselect current element
				console.log('Clicked on canvas background from element hook, deselecting');
				setSelectedId(null);
				return;
			}

			// Find the clicked element through data attribute or by traversing parents
			let elementTarget = e.target;
			let elementId = null;

			// Check if clicked directly on an element or one of its children
			while (elementTarget && !elementId) {
				// Try to get element ID from data attribute
				const dataElementId = elementTarget.getAttribute('data-element-id');
				if (dataElementId) {
					elementId = dataElementId;
					break;
				}

				// Move up to parent
				elementTarget = elementTarget.parentElement;

				// Stop if we reach the canvas
				if (elementTarget === canvasRef.current) {
					break;
				}
			}

			// If we found an element ID, set it as selected and prepare for dragging
			if (elementId) {
				console.log(`Found element with ID: ${elementId}, selecting it`);
				setSelectedId(elementId);

				if (!isScaling) {
					const rect = canvasRef.current.getBoundingClientRect();
					setIsDragging(true);
					setDragStart({
						x: e.clientX - rect.left,
						y: e.clientY - rect.top,
					});
				}
			} else {
				// Clicked somewhere but not on an element
				console.log('Clicked outside any element, deselecting');
				setSelectedId(null);
			}
		},
		[isScaling, setSelectedId],
	);

	// Handle mouse move for dragging and scaling
	const handleMouseMove = useCallback(
		(e, canvasRef) => {
			if (!canvasRef.current) return;

			const rect = canvasRef.current.getBoundingClientRect();
			const x = e.clientX - rect.left;
			const y = e.clientY - rect.top;

			// Handle element dragging
			if (isDragging && selectedId) {
				setElements((prev) =>
					prev.map((el) =>
						el.id === selectedId
							? {
									...el,
									x: el.x + (x - dragStart.x),
									y: el.y + (y - dragStart.y),
								}
							: el,
					),
				);

				setDragStart({ x, y });
				setConnections((prev) => [...prev]); // Force connection redraw
			}
			// Handle element scaling
			else if (isScaling && scaleRef.current) {
				const { elementId, corner, centerX, centerY, initialScale, initialWidth, initialHeight } = scaleRef.current;

				const currentX = e.clientX;
				const currentY = e.clientY;

				// Calculate distance from center to current mouse position
				const dx = currentX - centerX;
				const dy = currentY - centerY;
				const distance = Math.sqrt(dx * dx + dy * dy);

				// Calculate initial distance from center to corner
				const initialDx = corner.includes('e') ? initialWidth / 2 : -initialWidth / 2;
				const initialDy = corner.includes('s') ? initialHeight / 2 : -initialHeight / 2;
				const initialDistance = Math.sqrt(initialDx * initialDx + initialDy * initialDy);

				// Calculate scale factor
				const scaleFactor = distance / initialDistance;
				const newScale = initialScale * scaleFactor;

				// Update element scale with limits
				setElements((prev) =>
					prev.map((el) =>
						el.id === elementId
							? {
									...el,
									scale: Math.max(0.2, Math.min(5, newScale)),
								}
							: el,
					),
				);

				setConnections((prev) => [...prev]); // Force connection redraw
			}
		},
		[isDragging, isScaling, selectedId, dragStart, setElements, setConnections],
	);

	// Handle mouse up to end dragging or scaling
	const handleMouseUp = useCallback(() => {
		setIsDragging(false);
		setIsScaling(false);
		scaleRef.current = null;
	}, []);

	// Handle mouse wheel for scaling
	const handleWheel = useCallback(
		(e) => {
			if (!selectedId) return;
			e.preventDefault();

			setElements((prev) =>
				prev.map((el) => {
					if (el.id === selectedId) {
						const scaleChange = e.deltaY > 0 ? 0.9 : 1.1;
						const newScale = el.scale * scaleChange;
						return {
							...el,
							scale: Math.max(0.2, Math.min(5, newScale)),
						};
					}
					return el;
				}),
			);

			setConnections((prev) => [...prev]); // Force connection redraw
		},
		[selectedId, setElements, setConnections],
	);

	return {
		// Element operations
		addTextElement,
		addImageElement,
		updateElement,
		updateElementSize,
		deleteElement,
		handleScaleStart,

		// Mouse event handlers
		handleElementMouseDown: handleMouseDown,
		handleElementMouseMove: handleMouseMove,
		handleElementMouseUp: handleMouseUp,
		handleElementWheel: handleWheel,

		// State
		isDragging,
		isScaling,
		scaleRef,
	};
};

export default useElementOperations;
