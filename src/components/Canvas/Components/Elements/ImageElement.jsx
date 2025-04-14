/**
 * ImageElement Component - Fixed Version with Proper Size Constraints
 *
 * This version ensures images display with fixed dimensions and
 * maintains proper aspect ratio within those constraints.
 */

import React, { useState, useEffect } from 'react';

const ImageElement = ({ element }) => {
	const [imageError, setImageError] = useState(false);
	const [isLoaded, setIsLoaded] = useState(false);

	// Default dimensions - will be used if the element doesn't specify any
	const DEFAULT_WIDTH = 250;
	const DEFAULT_HEIGHT = 150;

	// Reset states when element changes
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

	// Simplified source determination
	let imageSource = null;
	if (element.fileUrl) {
		imageSource = element.fileUrl;
	} else if (element.dataUrl) {
		imageSource = element.dataUrl;
	} else if (element.src) {
		imageSource = element.src;
	}

	// Use element dimensions if provided, otherwise use defaults
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

	return (
		<div
			className="relative overflow-hidden rounded border border-gray-300"
			style={{
				width: `${width}px`,
				height: `${height}px`,
				maxWidth: '100%',
			}}
		>
			{/* Show loading indicator until image loads */}
			{!isLoaded && !imageError && (
				<div className="absolute inset-0 flex items-center justify-center bg-gray-100">
					<div className="animate-pulse text-gray-500">Loading...</div>
				</div>
			)}

			{/* Display error placeholder if image fails to load */}
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

			{/* Footer for user uploaded images */}
			{element.file && isLoaded && !imageError && (
				<div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs p-1 truncate">
					{element.file.name}
				</div>
			)}
		</div>
	);
};

export default ImageElement;
