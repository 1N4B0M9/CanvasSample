import React, { useState, useRef } from 'react';
import ImageSearch from './ImageSearch';

const ToolBar = ({
	handleAddText,
	handleAddMentor,
	addImage,
	handleBackgroundUpload,
	handleBackgroundFromSearch,
	removeBackgroundImage,
	backgroundImage,
	updateBackgroundScale,
	handleExport,
	apiBaseUrl = 'https://vision-board-api-v2.onrender.com', // Updated API base URL
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
		<div className="bg-red-500 absolute left-4 top-18 mt-4 z-50">
			<p>Tool Bar here</p>
		</div>
	);
};

export default ToolBar;
