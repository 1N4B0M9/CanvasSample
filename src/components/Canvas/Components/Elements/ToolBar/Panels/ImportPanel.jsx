import React, { useRef } from 'react';
import { IoClose, IoCloudUpload } from 'react-icons/io5';
import { BsInfoCircle, BsFileEarmarkCode } from 'react-icons/bs';

/**
 * ImportPanel Component
 *
 * Allows users to import a previously exported canvas JSON file.
 * The imported canvas will restore all elements, connections, and settings
 * with full editing capabilities preserved.
 */
const ImportPanel = ({ handleImport, onClose }) => {
	// Reference to the hidden file input element
	const fileInputRef = useRef(null);

	/**
	 * Handle file selection from the file input
	 *
	 * This function is called when the user selects a file.
	 * It validates that the file is JSON format and passes it to the import handler.
	 */
	const handleFileChange = (event) => {
		const file = event.target.files[0];

		// Check if a file was selected
		if (!file) {
			return;
		}

		// Validate file type - must be JSON
		if (!file.name.endsWith('.json') && file.type !== 'application/json') {
			alert('Please select a valid JSON file (.json)');
			// Reset the file input so the same file can be selected again if needed
			event.target.value = '';
			return;
		}

		// Call the import handler with the selected file
		handleImport(file);

		// Reset the file input for next use
		event.target.value = '';

		// Close the panel after import
		onClose();
	};

	/**
	 * Trigger the file input click when the upload button is clicked
	 */
	const handleUploadClick = () => {
		if (fileInputRef.current) {
			fileInputRef.current.click();
		}
	};

	return (
		<div className="fixed right-0 top-0 h-full w-96 bg-white shadow-2xl z-40 transform transition-transform duration-300 ease-in-out translate-x-0">
			{/* Panel Header */}
			<div className="flex items-center justify-between p-4 border-b border-gray-200">
				<h3 className="text-lg font-semibold text-gray-800">Import Canvas</h3>
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
			<div className="p-4 space-y-4">
				{/* Import Section */}
				<div>
					<h4 className="text-sm font-semibold text-gray-700 mb-2">Load Saved Canvas</h4>

					{/* Hidden file input - only accepts JSON files */}
					<input
						ref={fileInputRef}
						type="file"
						accept=".json,application/json"
						onChange={handleFileChange}
						className="hidden"
					/>

					{/* Upload Button */}
					<button
						onClick={handleUploadClick}
						className="w-full px-4 py-3 bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition-colors flex items-center justify-center font-medium"
						type="button"
					>
						<IoCloudUpload className="text-lg mr-2" />
						Choose JSON File to Import
					</button>

					<p className="text-xs text-gray-600 mt-2">
						Select a previously saved canvas JSON file. All elements will be restored with full editing
						capabilities.
					</p>
				</div>

				{/* Divider */}
				<div className="border-t border-gray-200" />

				{/* Important Information */}
				<div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
					<div className="flex items-start">
						<BsInfoCircle className="text-yellow-600 mt-0.5 mr-2 flex-shrink-0" />
						<div>
							<h4 className="text-sm font-medium text-yellow-800 mb-2">Important:</h4>
							<div className="text-xs text-yellow-700 space-y-1">
								<div>• Importing will replace your current canvas</div>
								<div>• Make sure to save your current work first</div>
								<div>• Only JSON files exported from this app are supported</div>
							</div>
						</div>
					</div>
				</div>

				{/* What Gets Imported */}
				<div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
					<div className="flex items-start">
						<BsFileEarmarkCode className="text-purple-500 mt-0.5 mr-2 flex-shrink-0" />
						<div>
							<h4 className="text-sm font-medium text-purple-800 mb-2">What Gets Restored:</h4>
							<div className="text-xs text-purple-700 space-y-1">
								<div>• All text elements with formatting</div>
								<div>• All images (uploaded and from Unsplash)</div>
								<div>• All connections and arrows</div>
								<div>• Background image and settings</div>
								<div>• Element positions and sizes</div>
							</div>
						</div>
					</div>
				</div>

				{/* How to Use */}
				<div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
					<div className="flex items-start">
						<BsInfoCircle className="text-blue-500 mt-0.5 mr-2 flex-shrink-0" />
						<div>
							<h4 className="text-sm font-medium text-blue-800 mb-2">How to Use:</h4>
							<div className="text-xs text-blue-700 space-y-1">
								<div>1. Click &quot;Choose JSON File to Import&quot;</div>
								<div>2. Select your saved .json file</div>
								<div>3. Wait for the import to complete</div>
								<div>4. Continue editing your canvas!</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
};

export default ImportPanel;
