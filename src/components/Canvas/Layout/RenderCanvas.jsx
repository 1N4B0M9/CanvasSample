/**
 * RenderCanvas.jsx - Fixed to Fit Properly Within Available Container Space
 *
 * This version ensures the canvas uses only the available space and exports correctly
 */

import React, { useEffect } from 'react';
import { CanvasProvider, useCanvas } from '../Utils/CanvasContext';
import RenderElements from './RenderElements';
import RenderConnections from './RenderConnections';
import SidePanel from '../Components/Elements/SidePanel';
import ToolBar from '../Components/Elements/ToolBar/ToolBar';
import ProfileMenu from '../../../Layouts/Navbar/profileMenu';

const CanvasContent = () => {
	const {
		canvasRef,
		backgroundImage,
		backgroundScale,
		updateBackgroundImage,
		removeBackgroundImage,
		updateBackgroundScale,
		exportCanvas,
		exportCanvasAsJSON,
		importCanvasFromJSON,
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

	// Handlers for SidePanel actions
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

		console.log('Handling image add with data:', imageData);

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

		const canvasRect = canvasRef.current.getBoundingClientRect();
		const centerX = canvasRect.width / 2;
		const centerY = canvasRect.height / 2;

		addImageFromSearch(imageData, centerX, centerY);
	};

	// Handle background image upload
	const handleBackgroundUpload = (file) => {
		if (!file || !file.type.startsWith('image/')) {
			console.error('Invalid file type for background');
			return;
		}

		const reader = new FileReader();
		reader.onload = (e) => {
			updateBackgroundImage({
				url: e.target.result,
				name: file.name,
				type: 'upload',
			});
		};
		reader.readAsDataURL(file);
	};

	// Handle background image from search
	const handleBackgroundFromSearch = (imageData, apiKey) => {
		if (!imageData || !imageData.url) {
			console.error('Invalid image data for background');
			return;
		}

		// Trigger Unsplash download API
		if (apiKey && imageData.downloadLink) {
			fetch(imageData.downloadLink, {
				headers: {
					Authorization: `Client-ID ${apiKey}`,
				},
			}).catch((err) => console.error('Download trigger error:', err));
		}

		updateBackgroundImage({
			url: imageData.url,
			name: imageData.title || 'Background Image',
			type: 'search',
			attribution: {
				photographer: imageData.photographer,
				photographerUrl: imageData.photographerUrl,
			},
		});
	};

	// Handle canvas export as PNG
	const handleExport = () => {
		const fileName = `vision-board-${new Date().toISOString().split('T')[0]}.png`;
		exportCanvas(fileName);
	};

	/**
	 * Handle canvas export as JSON
	 *
	 * Exports the canvas in JSON format with all elements preserved
	 * so it can be imported later for continued editing
	 */
	const handleExportJSON = () => {
		const fileName = `canvas-${new Date().toISOString().split('T')[0]}.json`;
		exportCanvasAsJSON(fileName);
	};

	/**
	 * Handle canvas import from JSON file
	 *
	 * Imports a previously exported canvas JSON file and restores
	 * all elements, connections, and settings
	 *
	 * @param {File} file - The JSON file to import
	 */
	const handleImport = async (file) => {
		// Show confirmation dialog since import will replace current canvas
		const confirmed = window.confirm(
			'Importing will replace your current canvas. Make sure you have saved your work. Continue?',
		);

		if (!confirmed) {
			return;
		}

		// Call the import function from context
		const success = await importCanvasFromJSON(file);

		if (success) {
			alert('Canvas imported successfully! All elements have been restored.');
		}
	};

	// Calculate background style with scale
	const getBackgroundStyle = () => {
		if (!backgroundImage) return {};

		const scaleDecimal = backgroundScale / 100;

		return {
			backgroundImage: `url(${backgroundImage.url})`,
			backgroundSize: `${100 * scaleDecimal}% ${100 * scaleDecimal}%`,
			backgroundPosition: 'center',
			backgroundRepeat: 'no-repeat',
		};
	};

	return (
		<div className="relative w-full h-full overflow-hidden">
			{/* <p>Hi there</p> */}
			{/* Side panel with integrated handlers */}
			{/* <SidePanel
				handleAddText={handleAddText}
				handleAddMentor={handleAddMentor}
				addImage={handleAddImage}
				handleBackgroundUpload={handleBackgroundUpload}
				handleBackgroundFromSearch={handleBackgroundFromSearch}
				removeBackgroundImage={removeBackgroundImage}
				backgroundImage={backgroundImage}
				updateBackgroundScale={updateBackgroundScale}
				handleExport={handleExport}
			/> */}
			<div className=" rounded-xl absolute left-4 top-4  z-50  bg-white shadow flex flex-row">
				<ProfileMenu isCanvas={true} />
			</div>
			<ToolBar
				handleAddText={handleAddText}
				handleAddMentor={handleAddMentor}
				addImage={handleAddImage}
				handleBackgroundUpload={handleBackgroundUpload}
				handleBackgroundFromSearch={handleBackgroundFromSearch}
				removeBackgroundImage={removeBackgroundImage}
				backgroundImage={backgroundImage}
				updateBackgroundScale={updateBackgroundScale}
				handleExport={handleExport}
				handleExportJSON={handleExportJSON}
				handleImport={handleImport}
			/>

			{/* Main canvas drawing area - FITS WITHIN AVAILABLE CONTAINER SPACE */}
			<div
				ref={canvasRef}
				className="w-full h-full relative"
				style={{
					backgroundColor: backgroundImage ? 'transparent' : '#ffffff', // white background
					border: '1px solid #d1d5db', // gray-300
					boxSizing: 'border-box',

					// Apply background image styling
					...getBackgroundStyle(),
				}}
				onDrop={handleDrop}
				onDragOver={(e) => e.preventDefault()}
				onMouseDown={handleMouseDown}
				onMouseMove={handleMouseMove}
				onMouseUp={handleElementMouseUp}
				onMouseLeave={handleElementMouseUp}
				onWheel={handleElementWheel}
			>
				{/* Semi-transparent overlay when background is present to improve element visibility */}
				{backgroundImage && (
					<div className="absolute inset-0 bg-white bg-opacity-5 pointer-events-none" style={{ zIndex: -1 }} />
				)}

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
