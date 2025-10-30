import React from 'react';
import { IoClose } from 'react-icons/io5';
import ImageSearch from '../../ImageSearch';

const ImagePanel = ({ addImage, onClose }) => (
		<div
			className="fixed left-1/2 transform -translate-x-1/2 top-32 z-40 bg-white rounded-lg shadow-xl border border-gray-200"
			style={{ width: '420px', maxHeight: '500px' }}
		>
			{/* Panel Header */}
			<div className="flex items-center justify-between p-4 border-b border-gray-200">
				<h3 className="text-lg font-semibold text-gray-800">Add Images</h3>
				<button onClick={onClose} className="p-1 rounded-full hover:bg-gray-100 transition-colors" title="Close">
					<IoClose className="text-xl text-gray-600" />
				</button>
			</div>

			{/* Panel Content */}
			<div className="p-4" style={{ maxHeight: '400px', overflowY: 'auto' }}>
				<ImageSearch addImage={addImage} />
			</div>
		</div>
	);

export default ImagePanel;
