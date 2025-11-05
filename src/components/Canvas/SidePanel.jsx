import React, { useState, useRef } from 'react';
import ImageSearch from "./ImageSearch";

const SidePanel = ({ handleAddText, handleAddMentor, addImage }) => {

	const [isOpen, setIsOpen] = useState(true);

	const togglePanel = () => {
		setIsOpen(!isOpen);
	};

	return (
		<>
			<div className="absolute top-2 left-2 z-10">
				<button className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600" onClick={togglePanel}>
					Open Editing
				</button>

			</div>

			<div className={`overflow-auto fixed top-0 left-0 h-full w-64 z-50 bg-gray-800 text-white transform ${isOpen ? 'translate-x-0' : '-translate-x-full'} transition-transform duration-300 ease-in-out shadow-lg p-4 pt-16`}>
				<button className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 w-full mt-10 mb-2" onClick={togglePanel}>
					Close Editing
				</button>
				<button className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 w-full mb-2" onClick={handleAddText}>
					Add Text
				</button>
				<button className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 w-full" onClick={handleAddMentor}>
					Add Mentor
				</button>
				<ImageSearch addImage={addImage} />




			</div>
		</>
	);
};

export default SidePanel;


