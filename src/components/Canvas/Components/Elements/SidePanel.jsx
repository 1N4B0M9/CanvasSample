/**
 * SidePanel Component
 *
 * This component provides a collapsible side panel with tools for canvas editing:
 * - Add text elements
 * - Add mentor elements
 * - Search and add images from Unsplash
 *
 * The panel can be toggled open/closed to maximize workspace when needed.
 */

import React, { useState } from 'react';
import ImageSearch from './ImageSearch';

const SidePanel = ({ handleAddText, handleAddMentor, addImage }) => {
	// State to track panel visibility
	const [isOpen, setIsOpen] = useState(true);

	/**
	 * Toggle panel visibility
	 */
	const togglePanel = () => {
		setIsOpen(!isOpen);
	};

	return (
		<>
			{/* Toggle button - visible when panel is collapsed */}
			{!isOpen && (
				<div className="absolute left-4 z-100">
					<button
						onClick={togglePanel}
						className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 shadow-lg flex items-center"
					>
						<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
							<path
								fillRule="evenodd"
								d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 15a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z"
								clipRule="evenodd"
							/>
						</svg>
						Tools
					</button>
				</div>
			)}

			{/* Side panel */}
			<div
				className={`fixed top-24 left-0 h-full w-64 z-100 bg-gray-800 text-white transform transition-transform duration-300 ease-in-out shadow-xl ${
					isOpen ? 'translate-x-0' : '-translate-x-full'
				}`}
			>
				<div className="flex flex-col h-full">
					{/* Panel header */}
					<div className="p-4 border-b border-gray-700 flex justify-between items-center">
						<h2 className="text-xl font-semibold">Canvas Tools</h2>
						<button
							onClick={togglePanel}
							className="p-1 rounded-full hover:bg-gray-700 focus:outline-none"
							aria-label="Close panel"
						>
							<svg
								xmlns="http://www.w3.org/2000/svg"
								className="h-6 w-6"
								fill="none"
								viewBox="0 0 24 24"
								stroke="currentColor"
							>
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
							</svg>
						</button>
					</div>

					{/* Panel content */}
					<div className="p-4 overflow-y-auto flex-grow">
						{/* Element creation tools */}
						<div className="mb-6">
							<h3 className="text-lg font-semibold mb-3">Add Elements</h3>
							<div className="space-y-2">
								<button
									onClick={handleAddMentor}
									className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors flex items-center"
								>
									<svg
										xmlns="http://www.w3.org/2000/svg"
										className="h-5 w-5 mr-2"
										fill="none"
										viewBox="0 0 24 24"
										stroke="currentColor"
									>
										<path
											strokeLinecap="round"
											strokeLinejoin="round"
											strokeWidth={2}
											d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
										/>
									</svg>
									Add Mentor
								</button>
								<button
									onClick={handleAddText}
									className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors flex items-center"
								>
									<svg
										xmlns="http://www.w3.org/2000/svg"
										className="h-5 w-5 mr-2"
										fill="none"
										viewBox="0 0 24 24"
										stroke="currentColor"
									>
										<path
											strokeLinecap="round"
											strokeLinejoin="round"
											strokeWidth={2}
											d="M3 5h12M9 3v4m1 7h6m2 3H2a1 1 0 01-1-1V6a1 1 0 011-1h18a1 1 0 011 1v11a1 1 0 01-1 1z"
										/>
									</svg>
									Add Attribute
								</button>
							</div>
						</div>

						{/* Image search */}
						<ImageSearch addImage={addImage} />
					</div>

					{/* Panel footer */}
					<div className="p-4 border-t border-gray-700">
						<div className="text-sm text-gray-400">Double-click elements to edit their content.</div>
					</div>
				</div>
			</div>
		</>
	);
};

export default SidePanel;
