import React from 'react';
import { IoClose } from 'react-icons/io5';
import ImageSearch from '../../ImageSearch';

const ImagePanel = ({ addImage, onClose }) => (
	<div className="fixed right-0 top-0 h-full w-96 bg-white shadow-2xl z-40 transform transition-transform duration-300 ease-in-out translate-x-0">
		{/* Panel Header */}
		<div className="flex items-center justify-between p-4 border-b border-gray-200">
			<h3 className="text-lg font-semibold text-gray-800">Add Images</h3>
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
		<div className="px-4 overflow-y-auto" style={{ height: 'calc(100% - 65px)' }}>
			<ImageSearch addImage={addImage} />
		</div>
	</div>
);

export default ImagePanel;
