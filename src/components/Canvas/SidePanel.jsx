import React, { useState, useRef } from 'react';

const SidePanel = ({ handleAddText }) => {
	const [isEditing, setIsEditing] = useState(false);

	return (
		<div className="absolute top-4 left-4 z-10">
			<button className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600" onClick={handleAddText}>
				Add Text
			</button>
		</div>
	);
};

export default SidePanel;
