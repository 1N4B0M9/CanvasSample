import React from 'react';
import { IoClose, IoDownload, IoSave } from 'react-icons/io5';
import { BsInfoCircle, BsFileEarmarkCode } from 'react-icons/bs';

/**
 * ExportPanel Component
 *
 * Provides options to export the canvas in two formats:
 * 1. PNG - Static image export (for sharing/printing)
 * 2. JSON - Editable canvas export (can be re-imported and edited)
 */
const ExportPanel = ({ handleExport, handleExportJSON, onClose }) => (
		<div className="fixed right-0 top-0 h-full w-96 bg-white shadow-2xl z-40 transform transition-transform duration-300 ease-in-out translate-x-0">
			{/* Panel Header */}
			<div className="flex items-center justify-between p-4 border-b border-gray-200">
				<h3 className="text-lg font-semibold text-gray-800">Export Canvas</h3>
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
				{/* Section: Save as Editable JSON */}
				<div>
					<h4 className="text-sm font-semibold text-gray-700 mb-2">Save for Later Editing</h4>
					<button
						onClick={() => {
							handleExportJSON();
							onClose();
						}}
						className="w-full px-4 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors flex items-center justify-center font-medium"
						type="button"
					>
						<IoSave className="text-lg mr-2" />
						Save Canvas as JSON
					</button>
					<p className="text-xs text-gray-600 mt-2">
						Save your canvas with all elements editable. You can upload this file later to continue editing.
					</p>
				</div>

				{/* Divider */}
				<div className="border-t border-gray-200" />

				{/* Section: Export as Static Image */}
				<div>
					<h4 className="text-sm font-semibold text-gray-700 mb-2">Export as Image</h4>
					<button
						onClick={() => {
							handleExport();
							onClose();
						}}
						className="w-full px-4 py-3 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors flex items-center justify-center font-medium"
						type="button"
					>
						<IoDownload className="text-lg mr-2" />
						Download as PNG
					</button>
					<p className="text-xs text-gray-600 mt-2">
						Export as a static image for sharing or printing. Elements will not be editable.
					</p>
				</div>

				{/* Divider */}
				<div className="border-t border-gray-200" />

				{/* Export Tips for JSON */}
				<div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
					<div className="flex items-start">
						<BsFileEarmarkCode className="text-purple-500 mt-0.5 mr-2 flex-shrink-0" />
						<div>
							<h4 className="text-sm font-medium text-purple-800 mb-2">About JSON Format:</h4>
							<div className="text-xs text-purple-700 space-y-1">
								<div>• Preserves all elements and their positions</div>
								<div>• Keeps images, text, and connections editable</div>
								<div>• Can be uploaded to continue editing later</div>
								<div>• Smaller file size than image export</div>
							</div>
						</div>
					</div>
				</div>

				{/* Export Tips for PNG */}
				<div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
					<div className="flex items-start">
						<BsInfoCircle className="text-blue-500 mt-0.5 mr-2 flex-shrink-0" />
						<div>
							<h4 className="text-sm font-medium text-blue-800 mb-2">PNG Export Tips:</h4>
							<div className="text-xs text-blue-700 space-y-1">
								<div>• Position elements before exporting</div>
								<div>• Ensure text is readable</div>
								<div>• Check that connections are visible</div>
								<div>• Background scale affects final image</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	);

export default ExportPanel;
