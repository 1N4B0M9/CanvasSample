import React, { useState, useRef } from 'react';
import CanvasElement from '../components/Canvas/CanvasElement';
import SidePanel from '../components/Canvas/SidePanel';

const CustomCanvas = () => {
	const [elements, setElements] = useState([]);
	const [selectedId, setSelectedId] = useState(null);
	const [isDragging, setIsDragging] = useState(false);
	const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
	const [isScaling, setIsScaling] = useState(false);
	const canvasRef = useRef(null);
	const scaleRef = useRef(null);

	const handleAddText = () => {
		const newText = {
			id: Date.now().toString(),
			type: 'text',
			content: 'Double click to edit',
			x: 400,
			y: 100,
			rotation: 0,
			scale: 1,
			fontSize: 16,
			color: 'black',
		};
		setElements((prev) => [...prev, newText]);
		setSelectedId(newText.id);
	};
	const handleAddMentor = () => {
		const newMentor = {
			id: Date.now().toString(),
			type: 'mentor',
			content: 'Mentor Name',
			image: null,
			x: 400,
			y: 100,
			rotation: 0,
			scale: 1,
			fontSize: 16,
			color: 'black',
		};

		setElements((prev) => [...prev, newMentor]);

	};
	const addImage = async (image, key) => {
		try {
			await fetch(`${image.downloadLink}?client_id=${key}`);

		} catch (err) {
			console.error('Error triggering download:', err);
		}
		console.log(key)

		const img = new window.Image();
		img.crossOrigin = 'anonymous';
		img.src = image.url;

		img.onload = () => {
			const newImage = {
				id: Date.now().toString(),
				type: 'image',
				content: img.src,
				x: 500,
				y: 100,
				rotation: 0,
				scale: 1,
			};
			setElements((prev) => [...prev, newImage]);

		};
	};



	const handleDrop = (e) => {
		e.preventDefault();
		const file = e.dataTransfer.files[0];
		if (!file || !file.type.startsWith('image/')) return;

		const rect = canvasRef.current.getBoundingClientRect();
		const x = e.clientX - rect.left;
		const y = e.clientY - rect.top;

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
			};
			setElements((prev) => [...prev, newImage]);
		};
		reader.readAsDataURL(file);
	};

	const handleMouseDown = (e) => {
		if (e.target === canvasRef.current) {
			setSelectedId(null);
			return;
		}

		if (!isScaling) {
			const rect = canvasRef.current.getBoundingClientRect();
			setIsDragging(true);
			setDragStart({
				x: e.clientX - rect.left,
				y: e.clientY - rect.top,
			});
		}
	};

	const handleMouseMove = (e) => {
		if (!canvasRef.current) return;
		const rect = canvasRef.current.getBoundingClientRect();

		if (isDragging && selectedId) {
			const x = e.clientX - rect.left;
			const y = e.clientY - rect.top;

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
		} else if (isScaling && scaleRef.current) {
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
		}
	};

	const handleMouseUp = () => {
		setIsDragging(false);
		setIsScaling(false);
		scaleRef.current = null;
	};

	const handleWheel = (e) => {
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
	};

	const handleUpdateElement = (updatedElement) => {
		setElements((prev) => prev.map((el) => (el.id === updatedElement.id ? updatedElement : el)));
	};

	const handleDeleteElement = (id) => {
		setElements((prev) => prev.filter((el) => el.id !== id));
		setSelectedId(null);
	};

	const handleScaleStart = (elementId, scaleInfo, event) => {
		setIsScaling(true);
		scaleRef.current = {
			elementId,
			...scaleInfo,
		};
	};

	return (
		<div className="relative w-full h-screen">
			<SidePanel handleAddText={handleAddText} handleAddMentor={handleAddMentor} addImage={addImage} />

			<div
				ref={canvasRef}
				className="w-full h-full bg-white overflow-hidden"
				onDrop={handleDrop}
				onDragOver={(e) => e.preventDefault()}
				onMouseDown={handleMouseDown}
				onMouseMove={handleMouseMove}
				onMouseUp={handleMouseUp}
				onMouseLeave={handleMouseUp}
				onWheel={handleWheel}
			>
				{elements.map((element) => (
					<CanvasElement
						key={element.id}
						element={element}
						isSelected={selectedId === element.id}
						onSelect={setSelectedId}
						onUpdate={handleUpdateElement}
						onDelete={handleDeleteElement}
						onScaleStart={handleScaleStart}
					/>
				))}
			</div>
		</div>
	);
};

export default CustomCanvas;
