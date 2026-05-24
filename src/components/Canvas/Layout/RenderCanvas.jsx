/**
 * RenderCanvas.jsx - Fixed to Fit Properly Within Available Container Space
 *
 * This version ensures the canvas uses only the available space and exports correctly
 */

import React, { useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { CanvasProvider, useCanvas } from '../Utils/CanvasContext';
import RenderElements from './RenderElements';
import RenderConnections from './RenderConnections';
import SidePanel from '../Components/Elements/SidePanel';
import ToolBar from '../Components/Elements/ToolBar/ToolBar';
import ProfileMenu from '../../../Layouts/Navbar/profileMenu';
import DeleteConfirmModal from '../Components/DeleteConfirmModal';
import SparkleButton from '../Recommendations/SparkleButton';
import ResourcePanel from '../Recommendations/ResourcePanel';
import PathwayOverlay from '../Recommendations/PathwayOverlay';
import { detectGoal } from '../Recommendations/useGoalDetection';
import ViewportHUD from './ViewportHUD';

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
		elements,
		connections,
		arrows,
		selectedIds,
		deleteSelected,
		savePathwayToBoard,
		viewportOffset,
		viewportZoom,
		setViewportOffset,
		setViewportZoom,
		screenToWorld,
	} = useCanvas();

	const [confirmOpen, setConfirmOpen] = React.useState(false);
	const [deletionSummary, setDeletionSummary] = React.useState(null);

	// Recommendations state
	const [panelOpen, setPanelOpen] = React.useState(false);
	const [panelGoal, setPanelGoal] = React.useState({ goalType: null, domain: null });
	const [selectedResource, setSelectedResource] = React.useState(null);
	const [resourceCount, setResourceCount] = React.useState(0);

	const [isPanning, setIsPanning] = React.useState(false);
	const [isSpaceDown, setIsSpaceDown] = React.useState(false);
	const isSpaceDownRef = useRef(false);
	const panStartRef = React.useRef(null);

	const viewportZoomRef = useRef(viewportZoom);
	const viewportOffsetRef = useRef(viewportOffset);
	useEffect(() => { viewportZoomRef.current = viewportZoom; }, [viewportZoom]);
	useEffect(() => { viewportOffsetRef.current = viewportOffset; }, [viewportOffset]);

	React.useEffect(() => {
		const onKeyDown = (e) => {
			if (e.code === 'Space' && e.target.tagName !== 'TEXTAREA' && e.target.tagName !== 'INPUT') {
				e.preventDefault();
				isSpaceDownRef.current = true;
				setIsSpaceDown(true);
			}
		};
		const onKeyUp = (e) => {
			if (e.code === 'Space') {
				isSpaceDownRef.current = false;
				setIsSpaceDown(false);
				setIsPanning(false);
			}
		};
		window.addEventListener('keydown', onKeyDown);
		window.addEventListener('keyup', onKeyUp);
		return () => {
			window.removeEventListener('keydown', onKeyDown);
			window.removeEventListener('keyup', onKeyUp);
		};
	}, []);

	// Debounced count of text elements that contain a detectable goal (3s delay)
	React.useEffect(() => {
		const timer = setTimeout(() => {
			const count = elements.filter(
				(el) => el.type === 'text' && el.content && detectGoal(el.content) !== null,
			).length;
			setResourceCount(count);
		}, 3000);
		return () => clearTimeout(timer);
	}, [elements]);

	const handleDeleteSelected = React.useCallback(() => {
		const items = [];

		for (const id of selectedIds) {
			const el = elements.find((e) => e.id === id);
			if (el) {
				items.push({ id, type: el.type, label: el.label || null });
				continue;
			}
			const conn = connections.find((c) => c.id === id);
			if (conn) {
				items.push({ id, type: 'connection', label: conn.label || null });
				continue;
			}
			const arrow = arrows.find((a) => a.id === id);
			if (arrow) {
				items.push({ id, type: 'arrow', label: arrow.label || null });
			}
		}

		const selectedElementIds = new Set(
			items.filter((i) => ['text', 'image', 'mentor'].includes(i.type)).map((i) => i.id)
		);
		const implicitCount =
			connections.filter(
				(c) => !selectedIds.has(c.id) && (selectedElementIds.has(c.startId) || selectedElementIds.has(c.endId))
			).length +
			arrows.filter(
				(a) => !selectedIds.has(a.id) && (selectedElementIds.has(a.startId) || selectedElementIds.has(a.endId))
			).length;

		setDeletionSummary({ items, implicitCount });
		setConfirmOpen(true);
	}, [selectedIds, elements, connections, arrows]);

	useEffect(() => {
		const handleKeyDown = (e) => {
			if (e.key !== 'Delete' && e.key !== 'Backspace') return;
			const active = document.activeElement;
			if (active && (active.tagName === 'TEXTAREA' || active.tagName === 'INPUT')) return;
			if (selectedIds.size > 0) handleDeleteSelected();
		};
		window.addEventListener('keydown', handleKeyDown);
		return () => window.removeEventListener('keydown', handleKeyDown);
	}, [selectedIds, handleDeleteSelected]);

	const handleWheel = React.useCallback(
		(e) => {
			if (!e.ctrlKey) {
				handleElementWheel(e);
				return;
			}
			e.preventDefault();

			const currentZoom = viewportZoomRef.current;
			const currentOffset = viewportOffsetRef.current;
			const zoomDelta = e.deltaY < 0 ? 0.1 : -0.1;
			const newZoom = Math.max(0.1, Math.min(5, currentZoom + zoomDelta));

			const canvasRect = canvasRef.current.getBoundingClientRect();
			const cursorX = e.clientX - canvasRect.left;
			const cursorY = e.clientY - canvasRect.top;

			setViewportOffset({
				x: cursorX - (cursorX - currentOffset.x) * (newZoom / currentZoom),
				y: cursorY - (cursorY - currentOffset.y) * (newZoom / currentZoom),
			});
			setViewportZoom(newZoom);
		},
		[handleElementWheel, canvasRef],
	);

	useEffect(() => {
		const el = canvasRef.current;
		if (!el) return;
		el.addEventListener('wheel', handleWheel, { passive: false });
		return () => { if (el) el.removeEventListener('wheel', handleWheel); };
	}, [handleWheel]);

	const openPanelForGoal = React.useCallback((detection) => {
		setPanelGoal({ goalType: detection.goalType, domain: detection.domain });
		setPanelOpen(true);
	}, []);

	const handleDrop = (e) => {
		e.preventDefault();

		// Check if this is a magazine element bank drop
		const magazineImageId = e.dataTransfer.getData('magazine-image-id');
		if (magazineImageId) {
			// File should be in dataTransfer.files
			const file = e.dataTransfer.files[0];
			if (file && file.type.startsWith('image/')) {
				const rect = canvasRef.current.getBoundingClientRect();
				const world = screenToWorld(e.clientX - rect.left, e.clientY - rect.top);
				addImageElement(file, world.x, world.y);
			}
			return;
		}

		// Handle regular file drops
		const file = e.dataTransfer.files[0];
		if (!file || !file.type.startsWith('image/')) return;

		const rect = canvasRef.current.getBoundingClientRect();
		const world = screenToWorld(e.clientX - rect.left, e.clientY - rect.top);

		addImageElement(file, world.x, world.y);
	};

	const handleMouseDown = (e) => {
		if (isSpaceDownRef.current) {
			e.stopPropagation();
			setIsPanning(true);
			panStartRef.current = {
				mouseX: e.clientX,
				mouseY: e.clientY,
				offsetX: viewportOffset.x,
				offsetY: viewportOffset.y,
			};
			return;
		}

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
		if (isPanning && panStartRef.current) {
			const dx = e.clientX - panStartRef.current.mouseX;
			const dy = e.clientY - panStartRef.current.mouseY;
			setViewportOffset({
				x: panStartRef.current.offsetX + dx,
				y: panStartRef.current.offsetY + dy,
			});
			return;
		}

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

	const handleMouseUp = (e) => {
		setIsPanning(false);
		handleElementMouseUp(e);
	};

	// Handlers for SidePanel actions
	const handleAddText = () => {
		if (!canvasRef.current) return;
		const canvasRect = canvasRef.current.getBoundingClientRect();
		const world = screenToWorld(canvasRect.width / 2, canvasRect.height / 2);
		addTextElement(world.x, world.y);
	};

	const handleAddMentor = () => {
		if (!canvasRef.current) return;
		const canvasRect = canvasRef.current.getBoundingClientRect();
		const world = screenToWorld(canvasRect.width / 2, canvasRect.height / 2);
		addMentorElement(world.x, world.y);
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
		const screenCenterX = canvasRect.width / 2;
		const screenCenterY = canvasRect.height / 2;
		const worldPos = screenToWorld(screenCenterX, screenCenterY);
		addImageFromSearch(imageData, worldPos.x, worldPos.y);
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
				<ProfileMenu isCanvas />
			</div>
			<ToolBar
				handleAddText={handleAddText}
				handleAddMentor={handleAddMentor}
				addImage={handleAddImage}
				addImageElement={addImageElement}
				handleBackgroundUpload={handleBackgroundUpload}
				handleBackgroundFromSearch={handleBackgroundFromSearch}
				removeBackgroundImage={removeBackgroundImage}
				backgroundImage={backgroundImage}
				updateBackgroundScale={updateBackgroundScale}
				handleExport={handleExport}
				handleExportJSON={handleExportJSON}
				handleImport={handleImport}
				selectedCount={selectedIds.size}
				onDeleteSelected={handleDeleteSelected}
			/>

			{/* Recommendations: floating sparkle button */}
			<SparkleButton
				resourceCount={resourceCount}
				onOpen={() => {
					const goalEl = [...elements].reverse().find(
						(el) => el.type === 'text' && el.content && detectGoal(el.content),
					);
					const detected = goalEl
						? detectGoal(goalEl.content)
						: { goalType: null, domain: null };
					setPanelGoal({ goalType: detected.goalType, domain: detected.domain });
					setPanelOpen(true);
				}}
			/>

			{/* Recommendations: slide-in resource panel */}
			{panelOpen && (
				<ResourcePanel
					goalType={panelGoal.goalType}
					domain={panelGoal.domain}
					onClose={() => {
						setPanelOpen(false);
						setSelectedResource(null);
					}}
					onSelectResource={(resource) => setSelectedResource(resource)}
					selectedResourceId={selectedResource?.id}
				/>
			)}

			{/* Main canvas drawing area - FITS WITHIN AVAILABLE CONTAINER SPACE */}
			{/* eslint-disable-next-line jsx-a11y/no-static-element-interactions */}
			<div
				ref={canvasRef}
				className="w-full h-full relative"
				style={{
					backgroundColor: backgroundImage ? 'transparent' : '#ffffff', // white background
					border: '1px solid #d1d5db', // gray-300
					boxSizing: 'border-box',
					cursor: isPanning ? 'grabbing' : isSpaceDown ? 'grab' : undefined,

					// Apply background image styling
					...getBackgroundStyle(),
				}}
				onDrop={handleDrop}
				onDragOver={(e) => e.preventDefault()}
				onClick={() => setSelectedResource(null)}
				onMouseDown={handleMouseDown}
				onMouseMove={handleMouseMove}
				onMouseUp={handleMouseUp}
				onMouseLeave={handleMouseUp}
			>
				{/* Semi-transparent overlay when background is present to improve element visibility */}
				{backgroundImage && (
					<div className="absolute inset-0 bg-white bg-opacity-5 pointer-events-none" style={{ zIndex: -1 }} />
				)}

				<div
					style={{
						transform: `translate(${viewportOffset.x}px, ${viewportOffset.y}px) scale(${viewportZoom})`,
						transformOrigin: '0 0',
						position: 'absolute',
						width: 10000,
						height: 10000,
						left: -5000,
						top: -5000,
						pointerEvents: isPanning ? 'none' : 'auto',
					}}
				>
					<RenderConnections />
					<RenderElements onOpenPanel={openPanelForGoal} />
				</div>

				{/* Recommendations: pathway overlay on resource card hover */}
				{selectedResource && (
					<PathwayOverlay
						resource={selectedResource}
						onAddToBoard={() => {
							const originEl = elements.find(
								(el) =>
									el.type === 'text' &&
									el.content &&
									detectGoal(el.content)?.goalType === panelGoal.goalType,
							);
							savePathwayToBoard(selectedResource, originEl?.id);
							setPanelOpen(false);
							setSelectedResource(null);
						}}
					/>
				)}

				{/* zoom HUD — sits outside the transform wrapper so it stays fixed on screen */}
				<div style={{ position: 'absolute', bottom: '1rem', left: '1rem', zIndex: 50 }}>
					<ViewportHUD
						zoom={viewportZoom}
						onZoomIn={() => setViewportZoom((z) => Math.min(5, parseFloat((z * 1.1).toFixed(3))))}
						onZoomOut={() => setViewportZoom((z) => Math.max(0.1, parseFloat((z * 0.9).toFixed(3))))}
						onReset={() => {
							setViewportZoom(1);
							setViewportOffset({ x: 0, y: 0 });
						}}
					/>
				</div>
			</div>

			<DeleteConfirmModal
				open={confirmOpen}
				summary={deletionSummary}
				onClose={() => setConfirmOpen(false)}
				onConfirm={() => {
					deleteSelected();
					setConfirmOpen(false);
				}}
			/>
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

RenderCanvas.propTypes = {
	canvasId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
};

export default RenderCanvas;
