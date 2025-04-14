/**
 * Canvas Component Module
 *
 * This module represents the main Canvas page of the application. It serves as a container
 * for multiple canvas instances that users can switch between using tabs.
 *
 * Architecture Overview:
 * - This component sits at the page level in the application structure
 * - It utilizes the CanvasDataProvider context to manage and share canvas state
 * - The component hierarchy is:
 *   1. Canvas (main export) - Sets up the context provider with initial data
 *   2. CanvasDataContent - Handles tab switching logic and renders the active canvas
 *   3. CustomCanvas - The actual canvas implementation (imported from components/Canvas/Layout)
 *
 * The component implements a tab-based navigation system allowing users to switch between
 * multiple canvas instances while maintaining their state within the CanvasDataProvider.
 */

import React, { useState } from 'react';
import RenderCanvas from '../components/Canvas/Layout/RenderCanvas';
import { CanvasDataProvider, useCanvasData } from '../components/Canvas/Utils/CanvasDataContext';

/**
 * CanvasDataContent Component
 *
 * This component consumes the canvas data from context and manages:
 * - Tab navigation UI for switching between canvases
 * - Active canvas display logic
 * - State for tracking which canvas is currently active
 *
 * @returns {JSX.Element} The rendered canvas interface with tabs and active canvas
 */
const CanvasDataContent = () => {
	const [activeTab, setActiveTab] = useState(0);
	const { canvases } = useCanvasData();

	/**
	 * Handles tab selection and updates the active canvas
	 * @param {number} tabId - The ID of the selected canvas tab
	 */
	const handleTabChange = (tabId) => {
		setActiveTab(tabId);
	};

	return (
		<div className="relative w-full h-screen">
			{/* Tab navigation - positioned in the top-right corner with z-index to stay above canvas */}
			<div className="absolute top-4 right-4 flex space-x-2 z-10">
				{canvases.map((canvas) => (
					<button
						key={canvas.id}
						className={`px-4 py-2 rounded-lg transition-colors ${
							activeTab === canvas.id ? 'bg-blue-500 text-white' : 'bg-gray-200 hover:bg-gray-300'
						}`}
						onClick={() => handleTabChange(canvas.id)}
					>
						{canvas.name}
					</button>
				))}
			</div>

			{/* Canvas container - only shows the currently active canvas */}
			<div className="w-full h-full">
				{canvases.map((canvas) => (
					<div key={canvas.id} className={`w-full h-full ${activeTab === canvas.id ? 'block' : 'hidden'}`}>
						<RenderCanvas canvasId={canvas.id} />
					</div>
				))}
			</div>
		</div>
	);
};

/**
 * Canvas Component (Main Export)
 *
 * This is the main page component that:
 * - Sets up the initial canvas data (currently 3 canvases with simple names)
 * - Provides the CanvasDataProvider context to child components
 * - Renders the CanvasDataContent with appropriate context
 *
 * @returns {JSX.Element} The fully contextualized canvas page
 */
export default function Canvas() {
	// Initial canvas configuration with three default canvases
	const initialCanvases = [
		{ id: 0, name: '1' },
		{ id: 1, name: '2' },
		{ id: 2, name: '3' },
	];

	return (
		<CanvasDataProvider initialCanvases={initialCanvases}>
			<CanvasDataContent />
		</CanvasDataProvider>
	);
}
