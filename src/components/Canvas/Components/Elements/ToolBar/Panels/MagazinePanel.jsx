import React, { useState, useRef, useEffect } from 'react';
import { IoClose, IoChevronBack, IoChevronForward } from 'react-icons/io5';

// List of all images in VB Magazine JPEGs folder (sorted by filename)
const VB_MAGAZINE_IMAGES = [
	'1.jpeg',
	'2.jpeg',
	'3.jpeg',
	'4.jpeg',
	'5.jpeg',
	'6.jpg',
	'7.jpeg',
	'8.jpeg',
	'9.jpeg',
	'10.jpeg',
	'11.jpeg',
	'12.jpeg',
	'13.jpeg',
	'14.jpg',
	'15.jpeg',
	'16.jpeg',
	'17.jpeg',
	'18.jpeg',
	'19.jpeg',
	'20.jpeg',
	'21.jpeg',
	'22.jpeg',
	'23.jpeg',
	'24.jpg',
	'25.jpeg',
	'26.jpeg',
	'27.jpeg',
	'28.jpeg',
	'29.jpeg',
	'30.jpeg',
	'31.jpeg',
	'32.jpg',
	'33.jpeg',
	'34.jpeg',
	'35.jpeg',
	'36.jpeg',
	'37.jpeg',
	'38.jpeg',
	'39.jpeg',
	'40.jpeg',
	'41.jpeg',
	'42.jpeg',
	'43.jpeg',
	'44.jpeg',
	'45.jpeg',
];

const MagazinePanel = ({ addImageElement, onClose, elementBank, setElementBank }) => {
	const [pages, setPages] = useState([]);
	const [currentPage, setCurrentPage] = useState(0);
	const [detectedImages, setDetectedImages] = useState([]);
	const [selectedImage, setSelectedImage] = useState(null);
	const [imageDimensions, setImageDimensions] = useState({ width: 0, height: 0 });
	const [containerDimensions, setContainerDimensions] = useState({ width: 0, height: 0 });
	// elementBank and setElementBank are now passed as props to persist state
	const canvasRef = useRef(null);
	const imageRef = useRef(null);
	const containerRef = useRef(null);

	// Auto-load VB Magazine JPEGs folder on component mount
	useEffect(() => {
		const loadVBMagazineImages = async () => {
			const loadedPages = await Promise.all(
				VB_MAGAZINE_IMAGES.map((filename, index) => {
					return new Promise((resolve) => {
						const img = new Image();
						img.onload = () => {
							resolve({
								url: `/VB Magazine JPEGs/${filename}`,
								name: filename,
							});
						};
						img.onerror = () => {
							// If image fails to load, still add it to the list (will show broken image)
							resolve({
								url: `/VB Magazine JPEGs/${filename}`,
								name: filename,
							});
						};
						img.src = `/VB Magazine JPEGs/${filename}`;
					});
				})
			);

			setPages(loadedPages);
			setCurrentPage(0);
		};

		loadVBMagazineImages();
	}, []);

	// Calculate container dimensions based on viewport
	useEffect(() => {
		const updateContainerDimensions = () => {
			const availableWidth = 350; // Panel width minus padding
			const availableHeight = 400; // Max height for magazine viewer in panel

			setContainerDimensions({
				width: availableWidth,
				height: availableHeight,
			});
		};

		updateContainerDimensions();
		window.addEventListener('resize', updateContainerDimensions);
		return () => window.removeEventListener('resize', updateContainerDimensions);
	}, []);

	// Track image dimensions when loaded
	useEffect(() => {
		setImageDimensions({ width: 0, height: 0 });

		if (pages.length === 0 || !imageRef.current) return;

		const img = imageRef.current;
		const handleLoad = () => {
			setImageDimensions({
				width: img.naturalWidth,
				height: img.naturalHeight,
			});
		};

		const timeoutId = setTimeout(() => {
			if (img.complete && img.naturalWidth > 0) {
				handleLoad();
			} else {
				img.addEventListener('load', handleLoad);
			}
		}, 10);

		return () => {
			clearTimeout(timeoutId);
			img.removeEventListener('load', handleLoad);
		};
	}, [currentPage, pages]);

	// Detect clickable regions on the current page
	useEffect(() => {
		if (pages.length === 0 || !canvasRef.current) return;

		const canvas = canvasRef.current;
		const ctx = canvas.getContext('2d');
		const img = new Image();
		img.crossOrigin = 'anonymous';

		img.onload = () => {
			canvas.width = img.width;
			canvas.height = img.height;
			ctx.drawImage(img, 0, 0);

			const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
			const regions = detectImageRegions(imageData, canvas.width, canvas.height);
			setDetectedImages(regions);
		};

		img.src = pages[currentPage].url;
	}, [currentPage, pages]);

	// Keyboard navigation
	useEffect(() => {
		const handleKeyPress = (e) => {
			if (e.key === 'ArrowLeft') prevPage();
			if (e.key === 'ArrowRight') nextPage();
		};

		window.addEventListener('keydown', handleKeyPress);
		return () => window.removeEventListener('keydown', handleKeyPress);
	}, [currentPage, pages.length]);

	// Improved image detection using edge detection and contour analysis
	const detectImageRegions = (imageData, width, height) => {
		const regions = [];
		const data = imageData.data;

		// Convert to grayscale and detect edges
		const grayscale = new Uint8Array(width * height);
		const edges = new Uint8Array(width * height);

		// Convert to grayscale
		for (let i = 0; i < data.length; i += 4) {
			const gray = Math.round(0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]);
			grayscale[i / 4] = gray;
		}

		// Simple edge detection using Sobel operator
		for (let y = 1; y < height - 1; y++) {
			for (let x = 1; x < width - 1; x++) {
				const idx = y * width + x;

				// Sobel X
				const gx =
					-1 * grayscale[(y - 1) * width + (x - 1)] +
					1 * grayscale[(y - 1) * width + (x + 1)] +
					-2 * grayscale[y * width + (x - 1)] +
					2 * grayscale[y * width + (x + 1)] +
					-1 * grayscale[(y + 1) * width + (x - 1)] +
					1 * grayscale[(y + 1) * width + (x + 1)];

				// Sobel Y
				const gy =
					-1 * grayscale[(y - 1) * width + (x - 1)] +
					-2 * grayscale[(y - 1) * width + x] +
					-1 * grayscale[(y - 1) * width + (x + 1)] +
					1 * grayscale[(y + 1) * width + (x - 1)] +
					2 * grayscale[(y + 1) * width + x] +
					1 * grayscale[(y + 1) * width + (x + 1)];

				const magnitude = Math.sqrt(gx * gx + gy * gy);
				edges[idx] = magnitude > 50 ? 255 : 0;
			}
		}

		// Find rectangular regions using connected components
		const visited = new Array(width * height).fill(false);
		const minRegionSize = Math.min(width, height) * 0.05;
		const maxRegionSize = Math.min(width, height) * 0.8;

		for (let y = 0; y < height; y++) {
			for (let x = 0; x < width; x++) {
				const idx = y * width + x;
				if (!visited[idx] && edges[idx] > 0) {
					const region = floodFill(edges, visited, x, y, width, height);
					if (
						region &&
						region.width > minRegionSize &&
						region.height > minRegionSize &&
						region.width < maxRegionSize &&
						region.height < maxRegionSize
					) {
						const aspectRatio = region.width / region.height;
						if (aspectRatio > 0.3 && aspectRatio < 3.0) {
							regions.push({
								x: region.x,
								y: region.y,
								width: region.width,
								height: region.height,
								id: `region-${regions.length}`,
							});
						}
					}
				}
			}
		}

		if (regions.length === 0) {
			return createAdaptiveGrid(width, height);
		}

		return regions;
	};

	// Flood fill algorithm to find connected edge regions
	const floodFill = (edges, visited, startX, startY, width, height) => {
		const stack = [{ x: startX, y: startY }];
		let minX = startX,
			maxX = startX,
			minY = startY,
			maxY = startY;
		let pixelCount = 0;

		while (stack.length > 0) {
			const { x, y } = stack.pop();
			const idx = y * width + x;

			if (x < 0 || x >= width || y < 0 || y >= height || visited[idx] || edges[idx] === 0) {
				continue;
			}

			visited[idx] = true;
			pixelCount++;

			minX = Math.min(minX, x);
			maxX = Math.max(maxX, x);
			minY = Math.min(minY, y);
			maxY = Math.max(maxY, y);

			stack.push({ x: x + 1, y }, { x: x - 1, y }, { x, y: y + 1 }, { x, y: y - 1 });
		}

		if (pixelCount < 100) return null;

		return {
			x: minX,
			y: minY,
			width: maxX - minX + 1,
			height: maxY - minY + 1,
		};
	};

	// Fallback adaptive grid when edge detection fails
	const createAdaptiveGrid = (width, height) => {
		const regions = [];
		const aspectRatio = width / height;

		let cols, rows;
		if (aspectRatio > 1.5) {
			cols = 4;
			rows = 3;
		} else if (aspectRatio < 0.7) {
			cols = 3;
			rows = 4;
		} else {
			cols = 3;
			rows = 3;
		}

		const cellWidth = width / cols;
		const cellHeight = height / rows;

		for (let i = 0; i < rows; i++) {
			for (let j = 0; j < cols; j++) {
				regions.push({
					x: j * cellWidth,
					y: i * cellHeight,
					width: cellWidth,
					height: cellHeight,
					id: `grid-${i}-${j}`,
				});
			}
		}

		return regions;
	};

	// Calculate fit scale to make image fit within container
	const calculateFitScale = () => {
		if (
			imageDimensions.width === 0 ||
			imageDimensions.height === 0 ||
			containerDimensions.width === 0 ||
			containerDimensions.height === 0
		) {
			return 1;
		}

		const scaleX = containerDimensions.width / imageDimensions.width;
		const scaleY = containerDimensions.height / imageDimensions.height;
		return Math.min(scaleX, scaleY);
	};

	// Get displayed image dimensions (after fit scale)
	const getDisplayedDimensions = () => {
		const fitScale = calculateFitScale();
		return {
			width: imageDimensions.width * fitScale,
			height: imageDimensions.height * fitScale,
		};
	};

	// Handle click on page to detect and extract image
	const handlePageClick = (e) => {
		if (!imageRef.current || !containerRef.current) return;

		const containerRect = containerRef.current.getBoundingClientRect();
		const fitScale = calculateFitScale();

		const displayed = getDisplayedDimensions();
		const offsetX = (containerRect.width - displayed.width) / 2;
		const offsetY = (containerRect.height - displayed.height) / 2;

		const clickX = e.clientX - containerRect.left - offsetX;
		const clickY = e.clientY - containerRect.top - offsetY;

		const x = clickX / fitScale;
		const y = clickY / fitScale;

		const clicked = detectedImages.find(
			(region) => x >= region.x && x <= region.x + region.width && y >= region.y && y <= region.y + region.height
		);

		if (clicked) {
			setSelectedImage(clicked);
			extractAndAddToElementBank(clicked);
		}
	};

	// Extract and add to element bank (instead of downloading)
	const extractAndAddToElementBank = (region) => {
		const canvas = canvasRef.current;
		const extractCanvas = document.createElement('canvas');
		extractCanvas.width = region.width;
		extractCanvas.height = region.height;

		const ctx = extractCanvas.getContext('2d');
		ctx.drawImage(canvas, region.x, region.y, region.width, region.height, 0, 0, region.width, region.height);

		extractCanvas.toBlob(
			(blob) => {
				// Convert blob to File
				const filename = `magazine-image-page${currentPage + 1}-${region.id}.jpg`;
				const file = new File([blob], filename, { type: 'image/jpeg' });

				// Create element bank entry
				const elementBankItem = {
					id: `magazine-${Date.now()}-${region.id}`,
					file: file,
					fileUrl: URL.createObjectURL(blob),
					page: currentPage + 1,
					regionId: region.id,
					width: region.width,
					height: region.height,
				};

				setElementBank((prev) => [...prev, elementBankItem]);
			},
			'image/jpeg',
			0.95
		);
	};

	// Handle drag start for element bank items
	const handleDragStart = (e, elementBankItem) => {
		e.dataTransfer.effectAllowed = 'copy';
		e.dataTransfer.setData('application/json', JSON.stringify({ type: 'magazine-image', id: elementBankItem.id }));
		e.dataTransfer.setData('magazine-image-id', elementBankItem.id);
		// Store the file in a way that can be accessed on drop
		if (elementBankItem.file) {
			// Use dataTransfer items to store the file
			e.dataTransfer.items.clear();
			e.dataTransfer.items.add(elementBankItem.file);
		}
	};

	// Handle adding element from bank to canvas
	const handleAddToCanvas = (elementBankItem) => {
		if (addImageElement && elementBankItem.file) {
			// Add to canvas at center (x, y will be determined by drop position or canvas center)
			addImageElement(elementBankItem.file);
		}
	};

	// Remove item from element bank
	const handleRemoveFromBank = (id) => {
		setElementBank((prev) => {
			const updated = prev.filter((item) => item.id !== id);
			// Revoke object URL for removed items
			const removed = prev.find((item) => item.id === id);
			if (removed && removed.fileUrl) {
				URL.revokeObjectURL(removed.fileUrl);
			}
			return updated;
		});
	};

	const nextPage = () => {
		if (currentPage < pages.length - 1) {
			setCurrentPage(currentPage + 1);
			setSelectedImage(null);
		}
	};

	const prevPage = () => {
		if (currentPage > 0) {
			setCurrentPage(currentPage - 1);
			setSelectedImage(null);
		}
	};

	return (
		<div className="fixed right-0 top-0 h-full w-96 bg-white shadow-2xl z-40 transform transition-transform duration-300 ease-in-out translate-x-0">
			{/* Panel Header */}
			<div className="flex items-center justify-between p-4 border-b border-gray-200">
				<h3 className="text-lg font-semibold text-gray-800">Magazine Viewer</h3>
				<button onClick={onClose} className="p-1 rounded-full hover:bg-gray-100 transition-colors" title="Close" type="button">
					<IoClose className="text-xl text-gray-600" />
				</button>
			</div>

			{/* Panel Content */}
			<div className="px-4 overflow-y-auto" style={{ height: 'calc(100% - 65px)' }}>
				{/* Magazine Viewer Section */}
				<div className="mb-4">
					{/* Navigation */}
					{pages.length > 0 && (
						<div className="flex items-center justify-center gap-2 mb-3">
							<button
								onClick={prevPage}
								disabled={currentPage === 0}
								className="p-2 bg-gray-200 hover:bg-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed transition"
								title="Previous Page"
							>
								<IoChevronBack size={20} />
							</button>

							<span className="text-sm font-medium min-w-20 text-center">
								{currentPage + 1} / {pages.length}
							</span>

							<button
								onClick={nextPage}
								disabled={currentPage === pages.length - 1}
								className="p-2 bg-gray-200 hover:bg-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed transition"
								title="Next Page"
							>
								<IoChevronForward size={20} />
							</button>
						</div>
					)}

					{/* Magazine Page Viewer */}
					{pages.length > 0 ? (
						<div
							ref={containerRef}
							className="relative bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center mx-auto mb-3 cursor-crosshair border border-gray-300"
							style={{
								width: containerDimensions.width || '350px',
								height: containerDimensions.height || '400px',
								minWidth: '300px',
								minHeight: '300px',
							}}
							onClick={handlePageClick}
						>
							<div
								className="relative"
								style={{
									width:
										imageDimensions.width > 0 && containerDimensions.width > 0 ? getDisplayedDimensions().width : 'auto',
									height:
										imageDimensions.height > 0 && containerDimensions.height > 0
											? getDisplayedDimensions().height
											: 'auto',
									maxWidth: '100%',
									maxHeight: '100%',
								}}
							>
								<img
									ref={imageRef}
									src={pages[currentPage].url}
									alt={`Page ${currentPage + 1}`}
									className="block"
									style={{
										width:
											imageDimensions.width > 0 && containerDimensions.width > 0
												? getDisplayedDimensions().width
												: 'auto',
										height:
											imageDimensions.height > 0 && containerDimensions.height > 0
												? getDisplayedDimensions().height
												: 'auto',
										maxWidth: '100%',
										maxHeight: '100%',
										objectFit: 'contain',
									}}
								/>
							</div>

							{/* Hidden canvas for processing */}
							<canvas ref={canvasRef} className="hidden" />
						</div>
					) : (
						<div className="flex items-center justify-center h-64">
							<div className="text-center">
								<div className="text-4xl mb-2">📚</div>
								<p className="text-gray-500 text-sm">Loading magazine pages...</p>
							</div>
						</div>
					)}

					{/* Instructions */}
					<div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
						<p className="text-blue-800 text-sm text-center">
							Click on any region in the magazine page to extract that image
						</p>
						<p className="text-blue-600 text-xs text-center mt-1">
							{detectedImages.length} image regions detected on this page
						</p>
					</div>
				</div>

				{/* Element Bank Section */}
				<div className="border-t border-gray-200 pt-4">
					<div className="flex items-center justify-between mb-3">
						<h4 className="text-md font-semibold text-gray-800">Element Bank</h4>
						<span className="text-xs text-gray-500">({elementBank.length} items)</span>
					</div>

					{elementBank.length === 0 ? (
						<div className="text-center py-8 text-gray-400 text-sm">
							<p>Extracted images will appear here</p>
							<p className="text-xs mt-1">Drag and drop to add to canvas</p>
						</div>
					) : (
						<div className="grid grid-cols-2 gap-2">
							{elementBank.map((item) => (
								<div
									key={item.id}
									className="bg-gray-50 rounded-lg overflow-hidden border border-gray-200 relative group"
								>
									<div
										className="aspect-square bg-gray-100 relative cursor-move"
										draggable
										onDragStart={(e) => handleDragStart(e, item)}
										onClick={() => handleAddToCanvas(item)}
									>
										<img
											src={item.fileUrl}
											alt={`Extracted ${item.regionId}`}
											className="w-full h-full object-cover"
										/>
										<div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all flex items-center justify-center">
											<span className="text-white text-xs opacity-0 group-hover:opacity-100 transition-opacity">
												Click or Drag
											</span>
										</div>
									</div>
									<div className="p-2">
										<div className="text-xs text-gray-600 mb-1 truncate">
											Page {item.page} - {item.regionId}
										</div>
										<div className="flex gap-1">
											<button
												onClick={() => handleAddToCanvas(item)}
												className="flex-1 px-2 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded text-xs font-medium transition-colors"
											>
												Add
											</button>
											<button
												onClick={() => handleRemoveFromBank(item.id)}
												className="px-2 py-1 bg-red-500 hover:bg-red-600 text-white rounded text-xs transition-colors"
												title="Remove"
											>
												×
											</button>
										</div>
									</div>
								</div>
							))}
						</div>
					)}
				</div>
			</div>
		</div>
	);
};

export default MagazinePanel;

