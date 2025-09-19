import React from 'react';
import { IoClose, IoDownload } from 'react-icons/io5';
import { BsInfoCircle } from 'react-icons/bs';

const ExportPanel = ({ handleExport, onClose }) => {
	return (
		<div className="fixed right-0 top-0 h-full w-96 bg-white shadow-2xl z-40 transform transition-transform duration-300 ease-in-out translate-x-0">
			{/* Panel Header */}
			<div className="flex items-center justify-between p-4 border-b border-gray-200">
				<h3 className="text-lg font-semibold text-gray-800">Export Vision Board</h3>
				<button onClick={onClose} className="p-1 rounded-full hover:bg-gray-100 transition-colors" title="Close">
					<IoClose className="text-xl text-gray-600" />
				</button>
			</div>

			{/* Panel Content */}
			<div className="p-4">
				{/* Export Button */}
				<div className="mb-4">
					<button
						onClick={() => {
							handleExport();
							onClose();
						}}
						className="w-full px-4 py-3 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors flex items-center justify-center font-medium"
					>
						<IoDownload className="text-lg mr-2" />
						Download Vision Board
					</button>
				</div>

				{/* Export Tips */}
				<div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
					<div className="flex items-start">
						<BsInfoCircle className="text-blue-500 mt-0.5 mr-2 flex-shrink-0" />
						<div>
							<h4 className="text-sm font-medium text-blue-800 mb-2">Export Tips:</h4>
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
};

export default ExportPanel;
