import React, { useRef, useState } from 'react';
import SidePanel from './SidePanel';

const TextElement = ({ element, onUpdate, isEditing, setIsEditing, textRef }) => {
	const handleBlur = () => {
		setIsEditing(false);
	};

	const handleTextChange = (e) => {
		onUpdate({
			...element,
			content: e.target.value,
		});
	};

	return (
		<div className="min-h-[40px] p-2" data-element-id={element.id}>
			{isEditing ? (
				<textarea
					ref={textRef}
					value={element.content}
					onChange={handleTextChange}
					onBlur={handleBlur}
					className="bg-transparent resize-none outline-none"
					style={{
						fontSize: `${element.fontSize || 16}px`,
						fontFamily: element.fontFamily || 'inherit',
						color: element.color || 'black',
					}}
					data-element-id={element.id}
				/>
			) : (
				<div
					style={{
						fontSize: `${element.fontSize || 16}px`,
						fontFamily: element.fontFamily || 'inherit',
						color: element.color || 'black',
						whiteSpace: 'pre-wrap',
					}}
					data-element-id={element.id}
				>
					{element.content}
				</div>
			)}
		</div>
	);
};

export default TextElement;
