import React, { useRef, useState } from 'react';
import ImageElement from './ImageElement';
const MentorElement = ({ element, onUpdate, isEditing, setIsEditing, textRef }) => {
	const handleBlur = () => {
		setIsEditing(false);
	};

	const handleTextChange = (e) => {
		onUpdate({
			...element,
			content: e.target.value,
		});
	};

	const handleImageChange = (e) => {
		const file = e.target.files[0];
		if (file) {
			const reader = new FileReader();
			reader.onloadend = () => {
				onUpdate({
					...element,
					image: reader.result,
				});
			};
			reader.readAsDataURL(file);
		}
	};

	return (
		<>
			<div className="flex flex-col items-center space-y-4">
				<input
					type="file"
					accept="image/*"
					onChange={handleImageChange}
					className="hidden"
					id={`image-upload-${element.id}`}
				/>
				<label htmlFor={`image-upload-${element.id}`} className="bg-blue-500 text-white px-4 py-2 rounded cursor-pointer shadow">
					Select Image
				</label>
				{element.image && (
					//<ImageElement element={element.image} />
					<img
						src={element.image}
						alt="Selected"
						className="max-w-xs rounded shadow w-48 h-48 object-contain"
						draggable={false}
					/>
				)}
			</div>

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
		</>
	);
};
export default MentorElement;
