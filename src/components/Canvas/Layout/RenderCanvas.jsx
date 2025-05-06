/**
 * Updated RenderCanvas Component with SidePanel Integration
 *
 * This version ensures all changes to canvas elements and connections
 * are correctly saved to Firestore through the CanvasContext integration.
 */

import React, { useEffect } from 'react';
import { CanvasProvider, useCanvas } from '../Utils/CanvasContext';
import RenderElements from './RenderElements';
import RenderConnections from './RenderConnections';
import SidePanel from '../Components/Elements/SidePanel';

const CanvasContent = () => {
	const {
		canvasRef,
		updateMousePosition,
		resetSelection,
		handleElementMouseDown,
		handleElementMouseMove,
		handleElementMouseUp,
		handleElementWheel,
		addTextElement,
		addMentorElement,
		addImageElement,
		addImageFromSearch,
	} = useCanvas();

	const handleDrop = (e) => {
		e.preventDefault();
		const file = e.dataTransfer.files[0];
		if (!file || !file.type.startsWith('image/')) return;

		const rect = canvasRef.current.getBoundingClientRect();
		const x = e.clientX - rect.left;
		const y = e.clientY - rect.top;

		addImageElement(file, x, y);
	};

	const handleMouseDown = (e) => {
		if (e.target === canvasRef.current) {
			console.log('Clicked on canvas background, resetting selection');
			resetSelection();
			return;
		}

		let current = e.target;
		let isSvgElement = false;

		while (current && !isSvgElement) {
			if (
				current.tagName === 'svg' ||
				current.tagName === 'SVG' ||
				current.tagName === 'line' ||
				current.tagName === 'circle' ||
				current.tagName === 'polygon'
			) {
				isSvgElement = true;
				break;
			}
			current = current.parentElement;
			if (current === canvasRef.current) break;
		}

		if (!isSvgElement && !e.target.hasAttribute('data-element-id')) {
			const closestElementWithId = e.target.closest('[data-element-id]');
			if (!closestElementWithId) {
				console.log('Clicked on empty space, resetting selection');
				resetSelection();
				return;
			}
		}

		handleElementMouseDown(e, canvasRef);
	};

	const handleMouseMove = (e) => {
		if (!canvasRef.current) return;

		const rect = canvasRef.current.getBoundingClientRect();
		const x = e.clientX - rect.left;
		const y = e.clientY - rect.top;

		updateMousePosition(x, y);
		handleElementMouseMove(e, canvasRef);
	};

	useEffect(() => {
		const handleGlobalMouseMove = (e) => {
			if (canvasRef.current) {
				const rect = canvasRef.current.getBoundingClientRect();
				updateMousePosition(e.clientX - rect.left, e.clientY - rect.top);
			}
		};

		document.addEventListener('mousemove', handleGlobalMouseMove);
		return () => {
			document.removeEventListener('mousemove', handleGlobalMouseMove);
		};
	}, [updateMousePosition]);

	// Handlers for SidePanel actions - always use center positioning for consistency
	const handleAddText = () => {
		if (!canvasRef.current) return;
		const canvasRect = canvasRef.current.getBoundingClientRect();
		const centerX = canvasRect.width / 2;
		const centerY = canvasRect.height / 2;
		addTextElement(centerX, centerY);
	};

	const handleAddMentor = () => {
		if (!canvasRef.current) return;
		const canvasRect = canvasRef.current.getBoundingClientRect();
		const centerX = canvasRect.width / 2;
		const centerY = canvasRect.height / 2;
		addMentorElement(centerX, centerY);
	};

	const handleAddImage = (imageData, apiKey) => {
		if (!canvasRef.current) return;

		console.log('Handling image add with data:', imageData); // Debug log

		// Ensure the imageData has all the necessary properties
		if (!imageData || !imageData.url) {
			console.error('Invalid image data received');
			return;
		}

		// Trigger Unsplash download API to properly attribute the download
		if (apiKey && imageData.downloadLink) {
			fetch(imageData.downloadLink, {
				headers: {
					Authorization: `Client-ID ${apiKey}`,
				},
			}).catch((err) => console.error('Download trigger error:', err));
		}

		// Use the center of the canvas - this ensures consistency with other element types
		const canvasRect = canvasRef.current.getBoundingClientRect();
		const centerX = canvasRect.width / 2;
		const centerY = canvasRect.height / 2;

		// Make sure to pass the full imageData object with center coordinates
		addImageFromSearch(imageData, centerX, centerY);
	};

	return (
		<div className="relative w-full h-screen ">
			{/* Side panel with integrated handlers */}
			<SidePanel handleAddText={handleAddText} handleAddMentor={handleAddMentor} addImage={handleAddImage} />

			{/* Main canvas drawing area */}
			<div
				ref={canvasRef}
				className="w-full h-full bg-white overflow-hidden"
				onDrop={handleDrop}
				onDragOver={(e) => e.preventDefault()}
				onMouseDown={handleMouseDown}
				onMouseMove={handleMouseMove}
				onMouseUp={handleElementMouseUp}
				onMouseLeave={handleElementMouseUp}
				onWheel={handleElementWheel}
			>
				<RenderConnections />
				<RenderElements />
			</div>
		</div>
	);
};

/**
 * RenderCanvas Component
 *
 * This component wraps the CanvasContent in a CanvasProvider
 * to provide the necessary context and connection to Firestore.
 *
 * @param {Object} props - Component props
 * @param {number|string} props.canvasId - ID of the canvas to render
 * @returns {JSX.Element} - Rendered canvas with context
 */
const RenderCanvas = ({ canvasId }) => (
	<CanvasProvider canvasId={canvasId}>
		<CanvasContent />
	</CanvasProvider>
);

export default RenderCanvas;
