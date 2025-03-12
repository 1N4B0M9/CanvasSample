import React, { useRef, useState } from 'react';

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
		// Added return statement here
		<div className="min-w-[100px] min-h-[40px] p-2">
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
				/>
			) : (
				<div
					style={{
						fontSize: `${element.fontSize || 16}px`,
						fontFamily: element.fontFamily || 'inherit',
						color: element.color || 'black',
						whiteSpace: 'pre-wrap',
					}}
				>
					{element.content}
				</div>
			)}
		</div>
	);
};

export default TextElement;
