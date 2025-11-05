/**
 * Handle image load error
 */
/**
 * SidePanel.jsx - Enhanced with Vision Board Image Extraction
 *
 * Path: src/components/Canvas/Components/Elements/SidePanel.jsx
 */

import React, { useState, useRef } from 'react';
import ImageSearch from './ImageSearch';

const handleImageError = (imagePath) => {
	setImageLoadErrors((prev) => new Set(prev).add(imagePath));
};

const SidePanel = ({
	handleAddText,
	handleAddMentor,
	addImage,
	handleBackgroundUpload,
	handleBackgroundFromSearch,
	removeBackgroundImage,
	backgroundImage,
	updateBackgroundScale,
	handleExport,
	apiBaseUrl = process.env.REACT_APP_API_BASE_URL, // Updated API base URL
}) => {
	// Existing state
	const [isOpen, setIsOpen] = useState(true);
	const [activeTab, setActiveTab] = useState('elements');
	const [backgroundScale, setBackgroundScale] = useState(100);
	const backgroundUploadRef = useRef(null);

	// New state for vision board extraction
	const [extractionResults, setExtractionResults] = useState(null);
	const [extractionLoading, setExtractionLoading] = useState(false);
	const [extractionError, setExtractionError] = useState(null);
	const [selectedFile, setSelectedFile] = useState(null);
	const [imageLoadErrors, setImageLoadErrors] = useState(new Set());
	const extractionUploadRef = useRef(null);

	/**
	 * Toggle panel visibility
	 */
	const togglePanel = () => {
		setIsOpen(!isOpen);
	};

	/**
	 * Handle background file upload
	 */
	const handleBackgroundFileChange = (e) => {
		const file = e.target.files[0];
		if (file) {
			handleBackgroundUpload(file);
		}
		e.target.value = '';
	};

	/**
	 * Trigger background file upload
	 */
	const triggerBackgroundUpload = () => {
		backgroundUploadRef.current?.click();
	};

	/**
	 * Handle background scale change
	 */
	const handleScaleChange = (e) => {
		const newScale = parseInt(e.target.value);
		setBackgroundScale(newScale);
		if (updateBackgroundScale) {
			updateBackgroundScale(newScale);
		}
	};

	/**
	 * Reset background scale to fit screen
	 */
	const resetToFitScreen = () => {
		setBackgroundScale(100);
		if (updateBackgroundScale) {
			updateBackgroundScale(100);
		}
	};

	/**
	 * Set background to fill screen
	 */
	const setToFillScreen = () => {
		setBackgroundScale(150);
		if (updateBackgroundScale) {
			updateBackgroundScale(150);
		}
	};

	// ===== VISION BOARD EXTRACTION FUNCTIONS =====

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
		<>
			{/* Toggle button - visible when panel is collapsed */}
			{!isOpen && (
				<div className="absolute left-4 top-18 mt-4 z-50">
					<button
						onClick={togglePanel}
						className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 shadow-lg flex items-center"
					>
						<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
							<path
								fillRule="evenodd"
								d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 15a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z"
								clipRule="evenodd"
							/>
						</svg>
						Tools
					</button>
				</div>
			)}

			{/* Side panel */}
			<div
				className={`fixed top-16 mt-8 left-0 z-40 bg-gray-800 text-white transform transition-transform duration-300 ease-in-out shadow-xl ${
					isOpen ? 'translate-x-0' : '-translate-x-full'
				}`}
				style={{
					width: '320px',
					height: 'calc(100vh - 96px)',
					maxHeight: 'calc(100vh - 96px)',
				}}
				data-ui-element="true"
			>
				<div className="flex flex-col h-full">
					{/* Panel header - Fixed */}
					<div className="flex-shrink-0 p-4 border-b border-gray-700 flex justify-between items-center">
						<h2 className="text-xl font-semibold">Vision Board Tools</h2>
						<button
							onClick={togglePanel}
							className="p-1 rounded-full hover:bg-gray-700 focus:outline-none"
							aria-label="Close panel"
						>
							<svg
								xmlns="http://www.w3.org/2000/svg"
								className="h-6 w-6"
								fill="none"
								viewBox="0 0 24 24"
								stroke="currentColor"
							>
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
							</svg>
						</button>
					</div>

					{/* Tab navigation - Fixed */}
					<div className="flex-shrink-0 flex border-b border-gray-700">
						<button
							onClick={() => setActiveTab('elements')}
							className={`flex-1 px-2 py-2 text-xs font-medium ${
								activeTab === 'elements' ? 'bg-blue-600 text-white' : 'text-gray-300 hover:text-white hover:bg-gray-700'
							}`}
						>
							Elements
						</button>
						<button
							onClick={() => setActiveTab('extract')}
							className={`flex-1 px-2 py-2 text-xs font-medium ${
								activeTab === 'extract' ? 'bg-blue-600 text-white' : 'text-gray-300 hover:text-white hover:bg-gray-700'
							}`}
						>
							Extract
						</button>
						<button
							onClick={() => setActiveTab('background')}
							className={`flex-1 px-2 py-2 text-xs font-medium ${
								activeTab === 'background'
									? 'bg-blue-600 text-white'
									: 'text-gray-300 hover:text-white hover:bg-gray-700'
							}`}
						>
							Background
						</button>
						<button
							onClick={() => setActiveTab('export')}
							className={`flex-1 px-2 py-2 text-xs font-medium ${
								activeTab === 'export' ? 'bg-blue-600 text-white' : 'text-gray-300 hover:text-white hover:bg-gray-700'
							}`}
						>
							Export
						</button>
					</div>

					{/* Scrollable content area */}
					<div className="flex-1 overflow-y-auto min-h-0">
						<div className="p-4">
							{/* Elements Tab */}
							{activeTab === 'elements' && (
								<>
									{/* Element creation tools */}
									<div className="mb-6">
										<h3 className="text-lg font-semibold mb-3">Add Elements</h3>
										<div className="space-y-2">
											<button
												onClick={handleAddMentor}
												className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors flex items-center"
											>
												<svg
													xmlns="http://www.w3.org/2000/svg"
													className="h-5 w-5 mr-2"
													fill="none"
													viewBox="0 0 24 24"
													stroke="currentColor"
												>
													<path
														strokeLinecap="round"
														strokeLinejoin="round"
														strokeWidth={2}
														d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
													/>
												</svg>
												Add Mentor
											</button>
											<button
												onClick={handleAddText}
												className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors flex items-center"
											>
												<svg
													xmlns="http://www.w3.org/2000/svg"
													className="h-5 w-5 mr-2"
													fill="none"
													viewBox="0 0 24 24"
													stroke="currentColor"
												>
													<path
														strokeLinecap="round"
														strokeLinejoin="round"
														strokeWidth={2}
														d="M3 5h12M9 3v4m1 7h6m2 3H2a1 1 0 01-1-1V6a1 1 0 011 1h18a1 1 0 011 1v11a1 1 0 01-1 1z"
													/>
												</svg>
												Add Attribute
											</button>
										</div>
									</div>

									{/* Image search */}
									<ImageSearch addImage={addImage} />
								</>
							)}

							{/* Vision Board Extraction Tab */}
							{activeTab === 'extract' && (
								<div className="mb-6">
									<h3 className="text-lg font-semibold mb-3">Extract from Vision Board</h3>
									<div className="mb-2 p-2 bg-blue-600 bg-opacity-20 rounded">
										<div className="text-xs text-blue-200">
											Upload a vision board image to automatically extract individual elements
										</div>
									</div>

									{/* Upload section */}
									<div className="mb-4 p-3 bg-gray-700 rounded">
										<div className="space-y-3">
											{selectedFile && (
												<div className="text-sm text-gray-300">
													Selected: {selectedFile.name}
													<br />
													<span className="text-xs text-gray-400">
														({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
													</span>
												</div>
											)}

											{extractionError && (
												<div className="p-2 bg-red-600 bg-opacity-30 border border-red-500 rounded text-sm text-red-200">
													{extractionError}
													{extractionError.includes('HTTP 500') && (
														<div className="mt-1 text-xs">
															Try using a different image or check your internet connection.
														</div>
													)}
												</div>
											)}

											<div className="flex gap-2">
												<button
													onClick={triggerExtractionUpload}
													className="flex-1 px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded text-sm flex items-center justify-center"
												>
													<svg
														xmlns="http://www.w3.org/2000/svg"
														className="h-4 w-4 mr-1"
														fill="none"
														viewBox="0 0 24 24"
														stroke="currentColor"
													>
														<path
															strokeLinecap="round"
															strokeLinejoin="round"
															strokeWidth={2}
															d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
														/>
													</svg>
													Choose Image
												</button>

												<button
													onClick={handleVisionBoardUpload}
													disabled={!selectedFile || extractionLoading}
													className={`flex-1 px-3 py-2 rounded text-sm font-medium ${
														!selectedFile || extractionLoading
															? 'bg-gray-600 text-gray-400 cursor-not-allowed'
															: 'bg-green-600 hover:bg-green-700 text-white'
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

									{/* Loading indicator */}
									{extractionLoading && (
										<div className="flex items-center justify-center p-4">
											<div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500" />
											<span className="ml-2 text-sm text-gray-300">Extracting images from vision board...</span>
										</div>
									)}

									{/* Results section */}
									{extractionResults && (
										<div>
											<div className="flex items-center justify-between mb-3">
												<h4 className="text-md font-medium">
													Extracted Images ({extractionResults.num_boxes_found || extractionResults.boxes?.length || 0})
												</h4>
												<button
													onClick={clearExtractionResults}
													className="px-2 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-xs"
												>
													Clear
												</button>
											</div>

											{!extractionResults.boxes || extractionResults.boxes.length === 0 ? (
												<div className="p-3 bg-gray-700 rounded text-center text-gray-400 text-sm">
													No images were extracted from the vision board. Try using a different image with clearer
													separated elements.
												</div>
											) : (
												<div className="grid grid-cols-2 gap-2">
													{extractionResults.boxes.map((box, index) => {
														const boxId = box.id || index;
														const fullImageUrl = getFullImageUrl(box.image);
														const hasError = imageLoadErrors.has(box.image);

														return (
															<div key={boxId} className="bg-gray-700 rounded overflow-hidden">
																<div className="aspect-square bg-gray-600 relative">
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
																			className="w-full h-full object-cover cursor-pointer hover:opacity-80"
																			onError={() => handleImageError(box.image)}
																			onClick={() => handleAddExtractedImage(box)}
																			loading="lazy"
																		/>
																	)}
																</div>
																<div className="p-2">
																	<div className="text-xs text-gray-300 text-center">Box {boxId}</div>
																	<button
																		onClick={() => handleAddExtractedImage(box)}
																		className="w-full mt-1 px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs"
																		disabled={hasError}
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
							)}

							{/* Background Tab */}
							{activeTab === 'background' && (
								<>
									<div className="mb-6">
										<h3 className="text-lg font-semibold mb-3">Background Image</h3>

										{/* Current background display */}
										{backgroundImage && (
											<div className="mb-4 p-3 bg-gray-700 rounded">
												<div className="flex items-center justify-between mb-2">
													<span className="text-sm font-medium">Current Background</span>
													<button
														onClick={removeBackgroundImage}
														className="px-2 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-xs"
													>
														Remove
													</button>
												</div>
												<div className="text-xs text-gray-300 truncate mb-2">{backgroundImage.name}</div>

												{/* Background Scale Controls */}
												<div className="space-y-2">
													<div className="flex items-center justify-between">
														<span className="text-xs text-gray-400">Scale:</span>
														<span className="text-xs text-white">{backgroundScale}%</span>
													</div>

													<input
														type="range"
														min="10"
														max="300"
														value={backgroundScale}
														onChange={handleScaleChange}
														className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer slider"
													/>

													<div className="flex gap-1">
														<button
															onClick={resetToFitScreen}
															className="flex-1 px-2 py-1 bg-gray-600 hover:bg-gray-500 text-white rounded text-xs"
														>
															Fit Screen
														</button>
														<button
															onClick={setToFillScreen}
															className="flex-1 px-2 py-1 bg-gray-600 hover:bg-gray-500 text-white rounded text-xs"
														>
															Fill Screen
														</button>
													</div>
												</div>

												{backgroundImage.attribution && (
													<div className="text-xs text-gray-400 mt-2">
														Photo by{' '}
														<a
															href={backgroundImage.attribution.photographerUrl}
															target="_blank"
															rel="noopener noreferrer"
															className="text-blue-400 hover:underline"
														>
															{backgroundImage.attribution.photographer}
														</a>
													</div>
												)}
											</div>
										)}

										{/* Background upload */}
										<div className="space-y-2">
											<button
												onClick={triggerBackgroundUpload}
												className="w-full px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded transition-colors flex items-center"
											>
												<svg
													xmlns="http://www.w3.org/2000/svg"
													className="h-5 w-5 mr-2"
													fill="none"
													viewBox="0 0 24 24"
													stroke="currentColor"
												>
													<path
														strokeLinecap="round"
														strokeLinejoin="round"
														strokeWidth={2}
														d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
													/>
												</svg>
												Upload Background
											</button>

											<input
												ref={backgroundUploadRef}
												type="file"
												accept="image/*"
												onChange={handleBackgroundFileChange}
												className="hidden"
											/>
										</div>
									</div>

									{/* Background image search */}
									<ImageSearch
										addImage={handleBackgroundFromSearch}
										isBackgroundMode
										title="Search Background Images"
									/>
								</>
							)}

							{/* Export Tab */}
							{activeTab === 'export' && (
								<div className="mb-6">
									<h3 className="text-lg font-semibold mb-3">Export Vision Board</h3>

									<div className="space-y-4">
										{/* Export button */}
										<button
											onClick={handleExport}
											className="w-full px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded transition-colors flex items-center justify-center font-medium"
										>
											<svg
												xmlns="http://www.w3.org/2000/svg"
												className="h-5 w-5 mr-2"
												fill="none"
												viewBox="0 0 24 24"
												stroke="currentColor"
											>
												<path
													strokeLinecap="round"
													strokeLinejoin="round"
													strokeWidth={2}
													d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
												/>
											</svg>
											Download Vision Board
										</button>

										{/* Export tips */}
										<div className="p-3 bg-blue-600 bg-opacity-20 rounded">
											<h4 className="text-sm font-medium text-blue-300 mb-2">Export Tips:</h4>
											<div className="text-xs text-blue-200 space-y-1">
												<div>• Position elements before exporting</div>
												<div>• Ensure text is readable</div>
												<div>• Check that connections are visible</div>
												<div>• Background scale affects final image</div>
											</div>
										</div>
									</div>
								</div>
							)}
						</div>
					</div>

					{/* Panel footer - Fixed */}
					<div className="flex-shrink-0 p-4 border-t border-gray-700">
						<div className="text-sm text-gray-400 space-y-1">
							<div>• Double-click elements to edit</div>
							<div>• Drag elements to move them</div>
							<div>• Use corner handles to resize</div>
							<div>• Scroll to zoom in/out</div>
						</div>
					</div>
				</div>
			</div>
		</>
	);
};

export default SidePanel;
