import React, { useState, useRef } from 'react';
import ImageElement from './ImageElement';
import TextElement from './TextElement';
import MentorElement from './MentorElement';

const CanvasElement = ({ element, isSelected, onSelect, onUpdate, onDelete, onScaleStart }) => {
	const [isEditing, setIsEditing] = useState(false);
	const textRef = useRef(null);
	const elementRef = useRef(null);

	const handleDoubleClick = () => {
		if (element.type === 'text' || element.type === 'mentor') {
			setIsEditing(true);
			setTimeout(() => {
				textRef.current?.focus();
				textRef.current?.select();
			}, 0);
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

	const renderElement = () => {
		if (element.type === 'image') {
			return <ImageElement element={element} />;
		} if (element.type === 'text') {
			return (
				<TextElement
					element={element}
					onUpdate={onUpdate}
					isEditing={isEditing}
					setIsEditing={setIsEditing}
					textRef={textRef}
				/>
			);
		} if (element.type === 'mentor') {
			return (
				<MentorElement
					element={element}
					onUpdate={onUpdate}
					isEditing={isEditing}
					setIsEditing={setIsEditing}
					textRef={textRef}
				/>
			);
		} 
			return null;
		
	};

	return (
		<div
			ref={elementRef}
			className={`absolute ${isSelected ? '' : ''}`}
			style={{
				left: element.x,
				top: element.y,
				transform: `rotate(${element.rotation}deg) scale(${element.scale})`,
				transformOrigin: 'center',
				cursor: isEditing ? 'text' : 'move',
			}}
			onClick={(e) => {
				e.stopPropagation();
				onSelect(element.id);
			}}
			onDoubleClick={handleDoubleClick}
		>
			{renderElement()}

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
						<div className="absolute inset-2 border-2 border-blue-500 rounded" />

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
								onMouseDown={(e) => {
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
								}}
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