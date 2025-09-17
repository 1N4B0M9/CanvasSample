import React, { useState, useRef } from 'react';
import { IoClose, IoCloudUpload } from 'react-icons/io5';
import { BsInfoCircle } from 'react-icons/bs';
import { RiDeleteBin5Line } from 'react-icons/ri';

const ExtractPanel = ({ addImage, apiBaseUrl, onClose }) => {
	// State for vision board extraction
	const [extractionResults, setExtractionResults] = useState(null);
	const [extractionLoading, setExtractionLoading] = useState(false);
	const [extractionError, setExtractionError] = useState(null);
	const [selectedFile, setSelectedFile] = useState(null);
	const [imageLoadErrors, setImageLoadErrors] = useState(new Set());
	const extractionUploadRef = useRef(null);

	/**
	 * Handle image load error
	 */
	const handleImageError = (imagePath) => {
		setImageLoadErrors((prev) => new Set(prev).add(imagePath));
	};

	/**
	 * Handle vision board file selection
	 */
	const handleExtractionFileChange = (e) => {
		const file = e.target.files[0];
		if (file) {
			setSelectedFile(file);
			setExtractionError(null);
		}
		e.target.value = '';
	};

	/**
	 * Trigger vision board file upload
	 */
	const triggerExtractionUpload = () => {
		extractionUploadRef.current?.click();
	};

	/**
	 * Upload and process vision board image using form-data
	 */
	const handleVisionBoardUpload = async () => {
		if (!selectedFile) {
			setExtractionError('Please select a file first');
			return;
		}

		setExtractionLoading(true);
		setExtractionError(null);

		try {
			// Create FormData for file upload
			const formData = new FormData();
			formData.append('image', selectedFile);

			const response = await fetch(`${apiBaseUrl}/extract-boxes`, {
				method: 'POST',
				body: formData,
				cache: 'no-cache',
				mode: 'cors',
			});

			if (!response.ok) {
				const errorText = await response.text().catch(() => '');
				let errorData = {};
				try {
					errorData = JSON.parse(errorText);
				} catch (e) {
					throw new Error(errorText || `HTTP ${response.status}: ${response.statusText}`);
				}
				throw new Error(errorData.detail || errorData.message || `HTTP ${response.status}: ${response.statusText}`);
			}

			const result = await response.json();

			// Set the results directly
			setExtractionResults(result);
			setImageLoadErrors(new Set());

			// Clear the selected file
			setSelectedFile(null);
		} catch (error) {
			console.error('Vision board upload error:', error);
			setExtractionError(error instanceof Error ? error.message : 'Upload failed');
		} finally {
			setExtractionLoading(false);
		}
	};

	/**
	 * Get full image URL (handles base64 data URIs and API paths)
	 */
	const getFullImageUrl = (imagePath) => {
		// If it's already a data URI (base64), return as-is
		if (imagePath.startsWith('data:')) {
			return imagePath;
		}
		// If it starts with http/https, return as-is
		if (imagePath.startsWith('http')) {
			return imagePath;
		}
		// Otherwise, construct URL from API base
		return `${apiBaseUrl}${imagePath}`;
	};

	/**
	 * Add extracted image to canvas
	 */
	const handleAddExtractedImage = (box) => {
		const imageUrl = getFullImageUrl(box.image);

		// Create image object similar to other image sources
		const imageData = {
			url: imageUrl,
			alt: `Extracted box ${box.id}`,
			source: 'extraction',
		};

		addImage(imageData);
	};

	/**
	 * Clear extraction results
	 */
	const clearExtractionResults = () => {
		setExtractionResults(null);
		setExtractionError(null);
		setSelectedFile(null);
	};

	return (
		<div
			className="fixed left-1/2 transform -translate-x-1/2 top-32 z-40 bg-white rounded-lg shadow-xl border border-gray-200"
			style={{ width: '420px', maxHeight: '600px' }}
		>
			{/* Panel Header */}
			<div className="flex items-center justify-between p-4 border-b border-gray-200">
				<h3 className="text-lg font-semibold text-gray-800">Extract from Vision Board</h3>
				<button onClick={onClose} className="p-1 rounded-full hover:bg-gray-100 transition-colors" title="Close">
					<IoClose className="text-xl text-gray-600" />
				</button>
			</div>

			{/* Panel Content */}
			<div className="p-4" style={{ maxHeight: '520px', overflowY: 'auto' }}>
				{/* Info Section */}
				<div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
					<div className="flex items-start">
						<BsInfoCircle className="text-blue-500 mt-0.5 mr-2 flex-shrink-0" />
						<div className="text-xs text-blue-700">
							Upload a vision board image to automatically extract individual elements
						</div>
					</div>
				</div>

				{/* Upload Section */}
				<div className="mb-4 p-3 bg-gray-50 rounded-lg border">
					<div className="space-y-3">
						{selectedFile && (
							<div className="text-sm text-gray-700">
								Selected: {selectedFile.name}
								<br />
								<span className="text-xs text-gray-500">({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)</span>
							</div>
						)}

						{extractionError && (
							<div className="p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">
								{extractionError}
								{extractionError.includes('HTTP 500') && (
									<div className="mt-1 text-xs">Try using a different image or check your internet connection.</div>
								)}
							</div>
						)}

						<div className="flex gap-2">
							<button
								onClick={triggerExtractionUpload}
								className="flex-1 px-3 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded text-sm flex items-center justify-center font-medium transition-colors"
							>
								<IoCloudUpload className="text-base mr-1" />
								Choose Image
							</button>

							<button
								onClick={handleVisionBoardUpload}
								disabled={!selectedFile || extractionLoading}
								className={`flex-1 px-3 py-2 rounded text-sm font-medium transition-colors ${
									!selectedFile || extractionLoading
										? 'bg-gray-300 text-gray-500 cursor-not-allowed'
										: 'bg-green-500 hover:bg-green-600 text-white'
								}`}
							>
								{extractionLoading ? (
									<span className="flex items-center justify-center">
										<div className="animate-spin rounded-full h-3 w-3 border-b border-white mr-1" />
										Processing...
									</span>
								) : (
									'Extract'
								)}
							</button>
						</div>

						<input
							ref={extractionUploadRef}
							type="file"
							accept="image/*"
							onChange={handleExtractionFileChange}
							className="hidden"
						/>
					</div>
				</div>

				{/* Loading indicator for extract */}
				{extractionLoading && (
					<div className="flex items-center justify-center p-4">
						<div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500" />
						<span className="ml-2 text-sm text-gray-600">Extracting images from vision board...</span>
					</div>
				)}

				{/* Results section */}
				{extractionResults && (
					<div>
						<div className="flex items-center justify-between mb-3">
							<h4 className="text-md font-medium text-gray-800">
								Extracted Images ({extractionResults.num_boxes_found || extractionResults.boxes?.length || 0})
							</h4>
							<button
								onClick={clearExtractionResults}
								className="p-1 rounded-full hover:bg-red-100 text-red-600 transition-colors"
								title="Clear Results"
							>
								<RiDeleteBin5Line className="text-sm" />
							</button>
						</div>

						{!extractionResults.boxes || extractionResults.boxes.length === 0 ? (
							<div className="p-3 bg-gray-50 rounded text-center text-gray-500 text-sm border">
								No images were extracted from the vision board. Try using a different image with clearer separated
								elements.
							</div>
						) : (
							<div className="grid grid-cols-2 gap-2">
								{extractionResults.boxes.map((box, index) => {
									const boxId = box.id || index;
									const fullImageUrl = getFullImageUrl(box.image);
									const hasError = imageLoadErrors.has(box.image);

									return (
										<div key={boxId} className="bg-gray-50 rounded-lg overflow-hidden border">
											<div className="aspect-square bg-gray-200 relative">
												{hasError ? (
													<div className="flex items-center justify-center h-full text-gray-400">
														<svg className="h-6 w-6" fill="currentColor" viewBox="0 0 20 20">
															<path
																fillRule="evenodd"
																d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z"
																clipRule="evenodd"
															/>
														</svg>
													</div>
												) : (
													<img
														src={fullImageUrl}
														alt={`Box ${boxId}`}
														className="w-full h-full object-cover cursor-pointer hover:opacity-80 transition-opacity"
														onError={() => handleImageError(box.image)}
														onClick={() => handleAddExtractedImage(box)}
														loading="lazy"
													/>
												)}
											</div>
											<div className="p-2">
												<div className="text-xs text-gray-600 text-center mb-1">Box {boxId}</div>
												<button
													onClick={() => handleAddExtractedImage(box)}
													disabled={hasError}
													className={`w-full px-2 py-1 rounded text-xs font-medium transition-colors ${
														hasError
															? 'bg-gray-300 text-gray-500 cursor-not-allowed'
															: 'bg-blue-500 hover:bg-blue-600 text-white'
													}`}
												>
													Add to Canvas
												</button>
											</div>
										</div>
									);
								})}
							</div>
						)}
					</div>
				)}
			</div>
		</div>
	);
};

export default ExtractPanel;
