/**
 * Updated CanvasElement Component with MentorElement integration
 */

import React, { useState, useRef, useEffect } from 'react';
import ImageElement from './Elements/ImageElement';
import TextElement from './Elements/TextElement';
import MentorElement from './Elements/MentorElement';

const CanvasElement = ({
	element,
	isSelected,
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
}) => {
	const [isEditing, setIsEditing] = useState(false);
	const elementRef = useRef(null);
	const contentRef = useRef(null);
	const textRef = useRef(null);

	useEffect(() => {
		const currentElement = elementRef.current;
		if (!currentElement) return;

		const measureElementSize = () => {
			if (!elementRef.current) return;

			try {
				const originalTransform = elementRef.current.style.transform || '';
				elementRef.current.style.transform = `rotate(${element.rotation}deg) scale(1)`;
				const rect = elementRef.current.getBoundingClientRect();
				elementRef.current.style.transform = originalTransform;
				onUpdateSize(element.id, rect.width, rect.height);
			} catch (error) {
				console.warn('Error measuring element size:', error);
			}
		};

		measureElementSize();

		let debounceTimer;
		const resizeObserver = new ResizeObserver(() => {
			if (elementRef.current) {
				clearTimeout(debounceTimer);
				debounceTimer = setTimeout(() => {
					measureElementSize();
				}, 50);
			}
		});

		resizeObserver.observe(currentElement);

		return () => {
			clearTimeout(debounceTimer);
			resizeObserver.disconnect();
		};
	}, [element.id, element.content, element.type, element.rotation, onUpdateSize]);

	const handleDoubleClick = () => {
		if (element.type === 'text' || element.type === 'mentor') {
			setIsEditing(true);
			setTimeout(() => {
				textRef.current?.focus();
				textRef.current?.select();
			}, 0);
		}
	};

	const handleClick = (e) => {
		e.stopPropagation();

		if (isConnecting) {
			onCompleteConnection(element.id);
		} else if (isCreatingArrow) {
			onCompleteArrow(element.id);
		} else {
			onSelect(element.id);
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
			}}
			onClick={handleClick}
			onDoubleClick={handleDoubleClick}
			data-element-id={element.id}
		>
			<div ref={contentRef} className="relative">
				{/* Render the appropriate element type */}
				{element.type === 'image' ? (
					<ImageElement element={element} />
				) : element.type === 'mentor' ? (
					<MentorElement
						element={element}
						onUpdate={onUpdate}
						isEditing={isEditing}
						setIsEditing={setIsEditing}
						textRef={textRef}
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
					</div>

					<div
						className="absolute -top-8 left-1/2 flex gap-2"
						style={{
							transform: `translateX(-50%) scale(${1 / element.scale})`,
							transformOrigin: 'center',
						}}
					>
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
				</>
			)}
		</div>
	);
};

export default CanvasElement;
