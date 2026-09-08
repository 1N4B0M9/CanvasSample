/**
 * Updated CanvasElement Component with MentorElement integration
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import ImageElement from './Elements/ImageElement';
import TextElement from './Elements/TextElement';
import MentorElement from './Elements/MentorElement';
import { useCanvas } from '../Utils/CanvasContext';

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
	isPanelAnchor = false,
}) => {
	const [isEditing, setIsEditing] = useState(false);
	const [isEditingLabel, setIsEditingLabel] = useState(false);
	const { highlightedStepIds } = useCanvas();
	const elementRef = useRef(null);
	const contentRef = useRef(null);
	const textRef = useRef(null);

	const lastMeasuredRef = useRef({ w: 0, h: 0 });

	const measureElementSize = useCallback(() => {
		if (!elementRef.current) return;
		// offsetWidth/offsetHeight are layout pixels, unaffected by CSS transforms
		// on this element or any ancestor — safe to store as world coordinates.
		const w = elementRef.current.offsetWidth;
		const h = elementRef.current.offsetHeight;
		if (w === lastMeasuredRef.current.w && h === lastMeasuredRef.current.h) return;
		lastMeasuredRef.current = { w, h };
		onUpdateSize(element.id, w, h);
	}, [element.id, onUpdateSize]);

	useEffect(() => {
		if (!elementRef.current) return;
		const observer = new ResizeObserver(measureElementSize);
		observer.observe(elementRef.current);
		return () => observer.disconnect();
	}, [element.id]);

	useEffect(() => {
		if (!isSelected) setIsEditingLabel(false);
	}, [isSelected]);

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
		onStartConnection(element.id);
	};

	const handleStartArrow = (e) => {
		e.stopPropagation();
		e.preventDefault();
		if (typeof onStartArrow === 'function') {
			onStartArrow(element.id);
		}
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

		onScaleStart(
			element.id,
			{
				corner,
				centerX,
				centerY,
				initialScale: element.scale,
				initialWidth: rect.width,
				initialHeight: rect.height,
			},
			e,
		);
	};

	return (
		<div
			ref={elementRef}
			className={`absolute ${isConnecting ? 'cursor-crosshair' : isCreatingArrow ? 'cursor-crosshair' : ''}`}
			style={{
				left: element.x,
				top: element.y,
				transform: `rotate(${element.rotation}deg) scale(${element.scale})`,
				transformOrigin: 'center',
				cursor: isEditing ? 'text' : 'move',
				boxShadow:
					isPanelAnchor || highlightedStepIds.includes(element.id)
						? '0 0 0 3px #f59e0b, 0 0 12px rgba(245, 158, 11, 0.35)'
						: undefined,
			}}
			onClick={handleClick}
			onDoubleClick={handleDoubleClick}
			data-element-id={element.id}
		>
			<div ref={contentRef} className="relative">
				{/* Render the appropriate element type */}
				{element.type === 'image' ? (
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
				{(element.type === 'text' || element.type === 'mentor') && (
					<div className="absolute left-0 top-full z-20 mt-1 flex flex-col items-start gap-1">
						{isSelected &&
							element.content &&
							element.content.trim().length >= 8 &&
							!isEditing &&
							!isConnecting &&
							!isCreatingArrow && (
								<button
									type="button"
									onClick={(e) => {
										e.stopPropagation();
										if (typeof onOpenPanel === 'function') onOpenPanel(element.content, element.id);
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
						}}
					>
						<div className="absolute inset-2 border-2 border-blue-500 rounded" data-connection-border="true" />

						{/* scale handles and mini-toolbar only make sense for single-select */}
						{selectedIds.size === 1 && (
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
							className="absolute -top-8 left-1/2 flex gap-2"
							style={{
								transform: `translateX(-50%) scale(${1 / element.scale})`,
								transformOrigin: 'center',
							}}
						>
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
