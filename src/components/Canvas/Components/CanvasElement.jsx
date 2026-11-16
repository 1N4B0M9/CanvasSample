/**
 * Updated CanvasElement Component with MentorElement integration
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import ImageElement from './Elements/ImageElement';
import TextElement from './Elements/TextElement';
import MentorElement from './Elements/MentorElement';
import GoalDeckPreview from '../Path/GoalDeckPreview';
import { useCanvas } from '../Utils/CanvasContext';

const TEXT_COLORS = [
	{ name: 'Black', value: 'black' },
	{ name: 'White', value: '#ffffff' },
	{ name: 'Red', value: '#dc2626' },
	{ name: 'Orange', value: '#ea580c' },
	{ name: 'Yellow', value: '#eab308' },
	{ name: 'Green', value: '#16a34a' },
	{ name: 'Blue', value: '#2563eb' },
	{ name: 'Purple', value: '#9333ea' },
	{ name: 'Pink', value: '#db2777' },
	{ name: 'Gray', value: '#6b7280' },
];

const CanvasElement = ({
	element,
	isSelected,
	selectedIds,
	isConnecting,
	isCreatingArrow,
	connections,
	arrows,
	onSelect,
	onUpdate,
	onUpdateSize,
	onDelete,
	onScaleStart,
	onStartConnection,
	onCompleteConnection,
	onStartArrow,
	onCompleteArrow,
	onOpenPanel,
	onOpenSubsteps,
	substepsFocusRequest,
	isPanelAnchor = false,
}) => {
	const [isEditing, setIsEditing] = useState(false);
	const [isEditingLabel, setIsEditingLabel] = useState(false);
	const [isColorPickerOpen, setIsColorPickerOpen] = useState(false);
	const [isPathExpanded, setIsPathExpanded] = useState(false);
	const { highlightedStepIds, canvasRef } = useCanvas();
	const elementRef = useRef(null);
	const contentRef = useRef(null);
	const textRef = useRef(null);

	const lastMeasuredRef = useRef({ w: 0, h: 0 });

	const measureElementSize = useCallback(() => {
		if (!elementRef.current || element.type === 'image') return;
		// offsetWidth/offsetHeight are layout pixels, unaffected by CSS transforms
		// on this element or any ancestor — safe to store as world coordinates.
		const w = elementRef.current.offsetWidth;
		const h = elementRef.current.offsetHeight;
		if (w === lastMeasuredRef.current.w && h === lastMeasuredRef.current.h) return;
		lastMeasuredRef.current = { w, h };
		onUpdateSize(element.id, w, h);
	}, [element.id, onUpdateSize]);

	useEffect(() => {
		if (!elementRef.current || element.type === 'image') return;
		const observer = new ResizeObserver(measureElementSize);
		observer.observe(elementRef.current);
		return () => observer.disconnect();
	}, [element.id, element.type, measureElementSize]);

	useEffect(() => {
		if (!isSelected) setIsEditingLabel(false);
	}, [isSelected]);

	useEffect(() => {
		if (!isSelected || element.type !== 'text') {
			setIsColorPickerOpen(false);
		}
	}, [element.id, element.type, isSelected]);

	useEffect(() => {
		if (!isColorPickerOpen) return undefined;

		const handleKeyDown = (event) => {
			if (event.key === 'Escape') {
				setIsColorPickerOpen(false);
			}
		};

		document.addEventListener('keydown', handleKeyDown);
		return () => document.removeEventListener('keydown', handleKeyDown);
	}, [isColorPickerOpen]);

	const handleDoubleClick = () => {
		if (element.type === 'text' || element.type === 'mentor') {
			setIsEditing(true);
			setTimeout(() => {
				textRef.current?.focus();
				textRef.current?.select();
			}, 0);
		} else if (element.type === 'image') {
			// double-clicking an image opens the label editor
			setIsEditingLabel(true);
		}
	};

	const handleClick = (e) => {
		e.stopPropagation();

		if (isConnecting) {
			onCompleteConnection(element.id);
		} else if (isCreatingArrow) {
			onCompleteArrow(element.id);
		} else {
			onSelect(element.id, e.shiftKey);
		}
	};

	const handleStartConnection = (e) => {
		e.stopPropagation();
		e.preventDefault();
		onStartConnection(element.id, e);
	};

	const handleStartArrow = (e) => {
		e.stopPropagation();
		e.preventDefault();
		if (typeof onStartArrow === 'function') {
			onStartArrow(element.id, e);
		}
	};

	const handleTextColorChange = (color) => {
		onUpdate({
			...element,
			color,
		});
		setIsColorPickerOpen(false);
	};

	const getScaleHandleStyle = (corner) => {
		const base = 'absolute w-3 h-3 bg-white border-2 border-blue-500 rounded-full';
		const cursors = {
			nw: 'cursor-nw-resize',
			ne: 'cursor-ne-resize',
			se: 'cursor-se-resize',
			sw: 'cursor-sw-resize',
		};

		return `${base} ${cursors[corner]}`;
	};

	const handleScaleHandleMouseDown = (corner, e) => {
		e.preventDefault();
		e.stopPropagation();

		const rect = elementRef.current.getBoundingClientRect();
		const centerX = rect.left + rect.width / 2;
		const centerY = rect.top + rect.height / 2;
		const canvasRect = canvasRef.current?.getBoundingClientRect();

		onScaleStart(
			element.id,
			{
				corner,
				centerX,
				centerY,
				initialScale: element.scale,
				initialWidth: rect.width,
				initialHeight: rect.height,
				canvasLeft: canvasRect?.left || 0,
				canvasTop: canvasRect?.top || 0,
			},
			e,
		);
	};
	const hasPathStack = element.type === 'image' && Array.isArray(element.path?.steps) && element.path.steps.length > 0;
	let pathButtonText = '✨';
	let pathButtonLabel = 'Get help with this goal';
	if (hasPathStack) {
		pathButtonText = isPathExpanded ? '×' : '▤';
		pathButtonLabel = isPathExpanded ? 'Close steps' : 'View steps';
	}

	return (
		<div
			ref={elementRef}
			className={`absolute select-none ${isConnecting ? 'cursor-crosshair' : isCreatingArrow ? 'cursor-crosshair' : ''}`}
			draggable={false}
			style={{
				left: element.x,
				top: element.y,
				transform: `rotate(${element.rotation}deg) scale(${element.scale})`,
				transformOrigin: 'center',
				zIndex: isPathExpanded ? 40 : undefined,
				cursor: isEditing ? 'text' : 'move',
				boxShadow:
					isPanelAnchor || highlightedStepIds.includes(element.id)
						? '0 0 0 3px #f59e0b, 0 0 12px rgba(245, 158, 11, 0.35)'
						: undefined,
			}}
			onClick={handleClick}
			onDoubleClick={handleDoubleClick}
			onDragStart={(e) => e.preventDefault()}
			data-element-id={element.id}
		>
			<div ref={contentRef} className="relative">
				{/* Render the appropriate element type */}
				{hasPathStack ? (
					<GoalDeckPreview
						element={element}
						path={element.path}
						isExpanded={isPathExpanded}
						onExpandedChange={setIsPathExpanded}
						onUpdatePath={(nextPath) => onUpdate({ ...element, path: nextPath })}
						onOpenSubsteps={(stepId) => onOpenSubsteps?.(element.id, stepId)}
						substepsFocusRequest={substepsFocusRequest}
					>
						<ImageElement
							element={element}
							onUpdate={onUpdate}
							isEditingLabel={isEditingLabel}
							setIsEditingLabel={setIsEditingLabel}
						/>
					</GoalDeckPreview>
				) : element.type === 'image' ? (
					<ImageElement
						element={element}
						onUpdate={onUpdate}
						isEditingLabel={isEditingLabel}
						setIsEditingLabel={setIsEditingLabel}
					/>
				) : element.type === 'mentor' ? (
					<MentorElement
						element={element}
						onUpdate={onUpdate}
						isEditing={isEditing}
						setIsEditing={setIsEditing}
						textRef={textRef}
						isSelected={isSelected}
					/>
				) : (
					<TextElement
						element={element}
						onUpdate={onUpdate}
						isEditing={isEditing}
						setIsEditing={setIsEditing}
						textRef={textRef}
					/>
				)}
				{/* Below-element row: path pill (selected only, so full boards stay quiet) +
				    always-visible clickable source icons. Never hover-only. */}
				{(element.type === 'text' || element.type === 'mentor' || (element.type === 'image' && !hasPathStack)) && (
					<div className="absolute left-0 top-full z-20 mt-1 flex flex-col items-start gap-1">
						{isSelected &&
							(element.type === 'image' ||
								(element.content && element.content.trim().length >= 8)) &&
							!isEditing &&
							!isEditingLabel &&
							!isConnecting &&
							!isCreatingArrow && (
								<button
									type="button"
									onClick={(e) => {
										e.stopPropagation();
										if (typeof onOpenPanel === 'function') {
											onOpenPanel(element.type === 'image' ? '' : element.content, element.id);
										}
									}}
									onMouseDown={(e) => e.stopPropagation()}
									className="whitespace-nowrap rounded-full bg-[#053254] px-4 py-2 text-[15px] font-bold text-white shadow hover:bg-[#0a4a78]"
								>
									Build a path for this →
								</button>
							)}
						{Array.isArray(element.citations) && element.citations.length > 0 && (
							<div className="flex items-center gap-1">
								{element.citations.slice(0, 4).map((citation) => {
									let host = null;
									try {
										host = new URL(citation.url).host;
									} catch {
										host = null;
									}
									return (
										<a
											key={citation.url}
											href={citation.url}
											target="_blank"
											rel="noopener noreferrer"
											title={citation.title || citation.url}
											onClick={(e) => e.stopPropagation()}
											onMouseDown={(e) => e.stopPropagation()}
											className="flex h-7 w-7 items-center justify-center rounded-full border border-[#D3D3D3] bg-white shadow-sm hover:bg-[#ECF4FA]"
										>
											{host ? (
												<img
													src={`https://www.google.com/s2/favicons?domain=${host}&sz=32`}
													alt={host}
													className="h-4 w-4 rounded-sm"
												/>
											) : (
												<span className="text-xs">🔗</span>
											)}
										</a>
									);
								})}
							</div>
						)}
					</div>
				)}
			</div>

			{isSelected && (
				<>
					<div
						className="absolute"
						style={{
							top: '-8px',
							left: '-8px',
							right: '-8px',
							bottom: '-8px',
							pointerEvents: 'none',
							zIndex: 32,
						}}
						data-path-resize={isPathExpanded ? 'true' : undefined}
					>
						{!isPathExpanded && (
							<div className="absolute inset-2 border-2 border-blue-500 rounded" data-connection-border="true" />
						)}

						{/* scale handles and mini-toolbar only make sense for single-select */}
						{selectedIds.size === 1 && !isPathExpanded && (
							<>
								{['nw', 'ne', 'se', 'sw'].map((corner) => (
									<div
										key={corner}
										className={getScaleHandleStyle(corner)}
										style={{
											top: corner.includes('n') ? '-4px' : 'auto',
											bottom: corner.includes('s') ? '-4px' : 'auto',
											left: corner.includes('w') ? '-4px' : 'auto',
											right: corner.includes('e') ? '-4px' : 'auto',
											transform: `scale(${1 / element.scale})`,
											transformOrigin: 'center',
											pointerEvents: 'auto',
											zIndex: 31,
										}}
										onMouseDown={(e) => handleScaleHandleMouseDown(corner, e)}
									/>
								))}
							</>
						)}
					</div>

					{selectedIds.size === 1 && (
						<div
							className="absolute -top-10 left-1/2 z-40 flex w-max items-center gap-2"
							style={{
								transform: `translateX(-50%) scale(${1 / element.scale})`,
								transformOrigin: 'center',
							}}
						>
							{element.type === 'text' && (
								<div className="relative">
									<button
										type="button"
										className="flex h-7 w-7 items-center justify-center rounded bg-white p-1 shadow hover:bg-gray-100"
										onClick={(e) => {
											e.stopPropagation();
											setIsColorPickerOpen((open) => !open);
										}}
										onMouseDown={(e) => e.stopPropagation()}
										title="Change text color"
										aria-label="Change text color"
										aria-haspopup="true"
										aria-expanded={isColorPickerOpen}
										data-text-color-control="true"
									>
										<span
											className="h-4 w-4 rounded-full border border-gray-400"
											style={{ backgroundColor: element.color || 'black' }}
											aria-hidden="true"
										/>
									</button>

									{isColorPickerOpen && (
										<div
											className="absolute bottom-full left-0 z-50 mb-1 grid w-max grid-cols-5 gap-1 rounded border border-gray-200 bg-white p-1.5 shadow-lg"
											role="group"
											aria-label="Text colors"
										>
											{TEXT_COLORS.map((color) => {
												const isCurrentColor = (element.color || 'black') === color.value;
												return (
													<button
														key={color.value}
														type="button"
														className={`h-6 w-6 rounded-full border border-gray-400 ${
															isCurrentColor ? 'ring-2 ring-blue-500 ring-offset-1' : ''
														}`}
														style={{ backgroundColor: color.value }}
														onClick={(e) => {
															e.stopPropagation();
															handleTextColorChange(color.value);
														}}
														onMouseDown={(e) => e.stopPropagation()}
														title={color.name}
														aria-label={color.name}
														aria-pressed={isCurrentColor}
													/>
												);
											})}
										</div>
									)}
								</div>
							)}

							{element.type === 'image' && hasPathStack && (
								<button
									type="button"
									className={
										hasPathStack
											? 'flex-none whitespace-nowrap rounded bg-white p-1 shadow hover:bg-gray-100'
											: 'flex-none whitespace-nowrap rounded-full bg-[#053254] px-4 py-2 text-[15px] font-bold text-white shadow hover:bg-[#0a4a78]'
									}
									onClick={(e) => {
										e.stopPropagation();
										if (hasPathStack) setIsPathExpanded((expanded) => !expanded);
										else onOpenPanel?.('', element.id);
									}}
									onMouseDown={(e) => e.stopPropagation()}
									data-path-toggle="true"
									title={pathButtonLabel}
									aria-label={pathButtonLabel}
								>
									{hasPathStack ? pathButtonText : 'Build a path for this →'}
								</button>
							)}
							{hasPathStack && !isPathExpanded && (
								<button
									type="button"
									className="rounded bg-white p-1 shadow hover:bg-gray-100"
									onClick={(e) => {
										e.stopPropagation();
										onOpenPanel?.('', element.id);
									}}
									onMouseDown={(e) => e.stopPropagation()}
									title="Regenerate path"
									aria-label="Regenerate path"
								>
									↻
								</button>
							)}
							{!isPathExpanded && (
								<>
									<button
										className="p-1 bg-white rounded shadow hover:bg-gray-100"
										onClick={handleStartConnection}
										title="Connect to another element"
									>
										↔
									</button>

									<button
										className="p-1 bg-white rounded shadow hover:bg-gray-100"
										onClick={handleStartArrow}
										title="Create arrow to another element"
									>
										→
									</button>

									<button
										className="p-1 bg-white rounded shadow hover:bg-gray-100 text-red-500"
										onClick={(e) => {
											e.stopPropagation();
											onDelete(element.id);
										}}
									>
										×
									</button>
								</>
							)}
						</div>
					)}
				</>
			)}
		</div>
	);
};

export default CanvasElement;

/*
<button
							className="p-1 bg-white rounded shadow hover:bg-gray-100"
							onClick={(e) => {
								e.stopPropagation();
								onUpdate({
									...element,
									rotation: element.rotation - 90,
								});
							}}
						>
							↺
						</button>

						<button
							className="p-1 bg-white rounded shadow hover:bg-gray-100"
							onClick={(e) => {
								e.stopPropagation();
								onUpdate({
									...element,
									rotation: element.rotation + 90,
								});
							}}
						>
							↻
						</button>
						*/
