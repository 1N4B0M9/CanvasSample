import React, { useRef } from 'react';
import { IoClose, IoCloudUpload } from 'react-icons/io5';
import { RiDeleteBin5Line } from 'react-icons/ri';
import ImageSearch from '../../ImageSearch';

const BackgroundPanel = ({
	handleBackgroundUpload,
	handleBackgroundFromSearch,
	removeBackgroundImage,
	backgroundImage,
	backgroundScale,
	onScaleChange,
	onClose,
}) => {
	const backgroundUploadRef = useRef(null);

	// Handle background file upload
	const handleBackgroundFileChange = (e) => {
		const file = e.target.files[0];
		if (file) {
			handleBackgroundUpload(file);
		}
		e.target.value = '';
	};

	// Trigger background file upload
	const triggerBackgroundUpload = () => {
		backgroundUploadRef.current?.click();
	};

	// Handle background scale change
	const handleScaleChange = (e) => {
		const newScale = parseInt(e.target.value);
		onScaleChange(newScale);
	};

	// Reset background scale to fit screen
	const resetToFitScreen = () => {
		onScaleChange(100);
	};

	// Set background to fill screen
	const setToFillScreen = () => {
		onScaleChange(150);
	};

	return (
		<div className="fixed right-0 top-0 h-full w-96 bg-white shadow-2xl z-40 transform transition-transform duration-300 ease-in-out translate-x-0">
			{/* Panel Header */}
			<div className="flex items-center justify-between p-4 border-b border-gray-200">
				<h3 className="text-lg font-semibold text-gray-800">Background Settings</h3>
				<button
					onClick={onClose}
					className="p-1 rounded-full hover:bg-gray-100 transition-colors"
					title="Close"
					type="button"
				>
					<IoClose className="text-xl text-gray-600" />
				</button>
			</div>

			{/* Panel Content */}
			<div className="p-4 overflow-y-auto" style={{ height: 'calc(100% - 65px)' }}>
				{/* Current Background Display */}
				{backgroundImage && (
					<div className="mb-4 p-3 bg-gray-50 rounded-lg border">
						<div className="flex items-center justify-between mb-2">
							<span className="text-sm font-medium text-gray-700">Current Background</span>
							<button
								onClick={removeBackgroundImage}
								className="p-1 rounded-full hover:bg-red-100 text-red-600 transition-colors"
								title="Remove Background"
								type="button"
							>
								<RiDeleteBin5Line className="text-sm" />
							</button>
						</div>

						<div className="text-xs text-gray-500 truncate mb-3">{backgroundImage.name}</div>

						{/* Background Scale Controls */}
						<div className="space-y-2">
							<div className="flex items-center justify-between">
								<span className="text-xs text-gray-600">Scale:</span>
								<span className="text-xs font-medium text-gray-800">{backgroundScale}%</span>
							</div>

							<input
								type="range"
								min="10"
								max="300"
								value={backgroundScale}
								onChange={handleScaleChange}
								className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
							/>

							<div className="flex gap-2">
								<button
									onClick={resetToFitScreen}
									className="flex-1 px-2 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded text-xs font-medium transition-colors"
									type="button"
								>
									Fit Screen
								</button>
								<button
									onClick={setToFillScreen}
									className="flex-1 px-2 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded text-xs font-medium transition-colors"
									type="button"
								>
									Fill Screen
								</button>
							</div>
						</div>

						{backgroundImage.attribution && (
							<div className="text-xs text-gray-500 mt-2">
								Photo by{' '}
								<a
									href={backgroundImage.attribution.photographerUrl}
									target="_blank"
									rel="noopener noreferrer"
									className="text-blue-500 hover:underline"
								>
									{backgroundImage.attribution.photographer}
								</a>
							</div>
						)}
					</div>
				)}

				{/* Upload Background Section */}
				<div className="my-2">
					<button
						onClick={triggerBackgroundUpload}
						className="w-full px-4 py-3 bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition-colors flex items-center justify-center font-medium"
						type="button"
					>
						<IoCloudUpload className="text-lg mr-2" />
						Upload Background Image
					</button>
					<input
						ref={backgroundUploadRef}
						type="file"
						accept="image/*"
						onChange={handleBackgroundFileChange}
						className="hidden"
					/>
				</div>

				{/* Search Background Section */}
				<div>
					<h4 className="text-lg mb-2 mt-4">Search Background Images</h4>
					<ImageSearch addImage={handleBackgroundFromSearch} isBackgroundMode title="" />
				</div>
			</div>
		</div>
	);
};

export default BackgroundPanel;
