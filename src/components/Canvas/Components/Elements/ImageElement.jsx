import React, { useState, useEffect } from 'react';

const ImageElement = ({ element, onUpdate, isEditingLabel, setIsEditingLabel }) => {
	const [imageError, setImageError] = useState(false);
	const [isLoaded, setIsLoaded] = useState(false);

	const DEFAULT_WIDTH = 250;
	const DEFAULT_HEIGHT = 150;

	useEffect(() => {
		setImageError(false);
		setIsLoaded(false);
	}, [element.id]);

	const handleImageError = () => {
		console.error('Image failed to load:', element);
		setImageError(true);
	};

	const handleImageLoad = () => {
		console.log('Image loaded successfully:', element);
		setIsLoaded(true);
	};

	let imageSource = null;
	if (element.fileUrl) {
		imageSource = element.fileUrl;
	} else if (element.dataUrl) {
		imageSource = element.dataUrl;
	} else if (element.src) {
		imageSource = element.src;
	}

	const width = element.width || DEFAULT_WIDTH;
	const height = element.height || DEFAULT_HEIGHT;

	if (!imageSource) {
		return (
			<div
				className="border border-red-500 flex items-center justify-center bg-gray-200 text-gray-600 p-2"
				style={{ width: `${width}px`, height: `${height}px` }}
			>
				Missing image source
			</div>
		);
	}

	// handle blur on the label input — trim, clear empty to undefined, close edit mode
	const handleLabelBlur = (e) => {
		const val = e.target.value.trim();
		onUpdate({ ...element, label: val || undefined });
		setIsEditingLabel(false);
	};

	return (
		<div
			className="relative overflow-hidden rounded border border-gray-300"
			style={{ width: `${width}px`, height: `${height}px`, maxWidth: '100%' }}
		>
			{!isLoaded && !imageError && (
				<div className="absolute inset-0 flex items-center justify-center bg-gray-100">
					<div className="animate-pulse text-gray-500">Loading...</div>
				</div>
			)}

			{imageError ? (
				<div className="w-full h-full flex items-center justify-center bg-gray-200 text-gray-600">
					<div className="text-center p-2">
						<div className="text-red-500 mb-1">⚠️</div>
						<div>Image failed to load</div>
					</div>
				</div>
			) : (
				<img
					src={imageSource}
					alt={element.alt || 'Canvas image'}
					className="object-contain"
					style={{
						visibility: isLoaded ? 'visible' : 'hidden',
						width: '100%',
						height: '100%',
						maxWidth: '100%',
						maxHeight: '100%',
					}}
					onLoad={handleImageLoad}
					onError={handleImageError}
					draggable={false}
				/>
			)}

			{element.file && isLoaded && !imageError && (
				<div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs p-1 truncate">
					{element.file.name}
				</div>
			)}

			{/* label overlay — always visible if label is set, swaps to input when editing */}
			{(element.label || isEditingLabel) && (
				<div
					className="absolute bottom-0 left-0 right-0 text-white text-xs px-2 py-1"
					style={{ background: 'rgba(0,0,0,0.55)' }}
				>
					{isEditingLabel ? (
						<input
							autoFocus
							defaultValue={element.label || ''}
							placeholder="add label..."
							onBlur={handleLabelBlur}
							onKeyDown={(e) => { if (e.key === 'Enter') e.target.blur(); }}
							onClick={(e) => e.stopPropagation()}
							onMouseDown={(e) => e.stopPropagation()}
							className="bg-transparent border-none outline-none text-white text-xs w-full placeholder-gray-400"
						/>
					) : (
						element.label
					)}
				</div>
			)}
		</div>
	);
};

export default ImageElement;
