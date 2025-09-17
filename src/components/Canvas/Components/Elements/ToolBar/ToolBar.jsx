import React, { useState, useRef } from 'react';
import { FaImages, FaShapes } from 'react-icons/fa6';
import ImageSearch from '../ImageSearch';
import { IoImage, IoLayers } from 'react-icons/io5';
import { PiSelectionBackgroundBold } from 'react-icons/pi';
import { TbFileExport } from 'react-icons/tb';
import { LuUserRound, LuUserRoundPlus } from 'react-icons/lu';
import { BsFileEarmarkFont } from 'react-icons/bs';
import { GrRedo, GrUndo } from 'react-icons/gr';
import { RiDeleteBin5Line } from 'react-icons/ri';

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

	// Main tool registary array
	const BaseToolRegistery = [
		{ Icon: LuUserRoundPlus, label: 'Add Mentor' },
		{ Icon: BsFileEarmarkFont, label: 'Add Attribute' },
		{ Icon: IoImage, label: 'Add Image' },
		{ Icon: IoLayers, label: 'Layers' },
		{ Icon: PiSelectionBackgroundBold, label: 'Background' },
		{ Icon: TbFileExport, label: 'Export' },
	];

	// Util tool registery for delete, redos, undos ect..
	const UtilToolRegistery = [
		{ Icon: GrUndo, label: 'Undo Action' },
		{ Icon: GrRedo, label: 'Redo Action' },
		{ Icon: RiDeleteBin5Line, label: 'Delete Element', isDelete: true },
	];

	return (
		<div className="px-2 py-1 rounded-xl absolute left-4 top-18 mt-4 z-50 border border-1 border-gray-300 bg-white shadow flex flex-row">
			{/* Base Tool Row*/}
			<div className="flex flex-row gap-1 items-center">
				{BaseToolRegistery.map(({ Icon, label }, idx) => (
					<div
						key={label}
						className="group relative rounded-md p-2 transition-colors duration-150 cursor-pointer hover:bg-blue-100"
						title={label}
					>
						<Icon className="text-xl" />
						{/* Tooltip */}
						<span className="pointer-events-none absolute left-1/2 -translate-x-1/2 top-full mt-1 z-50 whitespace-nowrap rounded bg-gray-800 px-2 py-1 text-xs text-white opacity-0 group-hover:opacity-100 transition-opacity duration-150">
							{label}
						</span>
					</div>
				))}
			</div>
			<div className="mx-2 border-l border-gray-300 h-8 self-center" />
			<div className="flex flex-row items-center">
				{/* Additional Tool Row */}
				{UtilToolRegistery.map(({ Icon, label, isDelete }, idx) => (
					<div
						key={label}
						className={
							'group relative rounded-md p-2 transition-colors duration-150 cursor-pointer ' +
							(isDelete ? 'bg-white hover:bg-red-100' : 'hover:bg-blue-100')
						}
						title={label}
					>
						<Icon
							className={
								isDelete ? 'text-xl text-red-300 group-hover:text-red-600 transition-colors duration-150' : 'text-xl'
							}
						/>
						{/* Tooltip */}
						<span className="pointer-events-none absolute left-1/2 -translate-x-1/2 top-full mt-1 z-50 whitespace-nowrap rounded bg-gray-800 px-2 py-1 text-xs text-white opacity-0 group-hover:opacity-100 transition-opacity duration-150">
							{label}
						</span>
					</div>
				))}
			</div>
		</div>
	);
};

export default ToolBar;
