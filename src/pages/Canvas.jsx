/**
 * Canvas.jsx - Fixed to Account for Navbar/Footer Layout
 *
 * This version calculates the available height after accounting for navbar
 * and ensures the canvas fits properly within the layout structure.
 */

import React, { useState, useEffect, useRef } from 'react';
import { doc, getDoc, collection } from 'firebase/firestore';
import RenderCanvas from '../components/Canvas/Layout/RenderCanvas';
import { CanvasDataProvider, useCanvasData } from '../components/Canvas/Utils/CanvasDataContext';
import { db } from '../firebase/firebase'; // Ensure this path is correct
import { useAuth } from '../firebase/AuthContext'; // Import auth context (ensure path is correct)

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
	const [availableHeight, setAvailableHeight] = useState('100vh');
	const { canvases } = useCanvasData();
	const contentRef = useRef(null);
	const containerRef = useRef(null);

	/**
	 * Calculate available height accounting for navbar and any other UI elements
	 */
	useEffect(() => {
		const calculateHeight = () => {
			// Get the navbar height (AppBar)
			const navbar =
				document.querySelector('header[class*="MuiAppBar"]') ||
				document.querySelector('nav') ||
				document.querySelector('[class*="navbar"]');

			const navbarHeight = navbar ? navbar.offsetHeight : 64; // Default to 64px if not found

			// Calculate available height minus navbar
			const windowHeight = window.innerHeight;
			const calculatedHeight = windowHeight - navbarHeight;

			console.log('Layout calculations:', {
				windowHeight,
				navbarHeight,
				calculatedHeight,
			});

			setAvailableHeight(`${calculatedHeight}px`);
		};

		// Calculate on mount
		calculateHeight();

		// Recalculate on resize
		const handleResize = () => {
			setTimeout(calculateHeight, 100); // Small delay to ensure DOM updates
		};

		window.addEventListener('resize', handleResize);

		// Also recalculate when navbar might change
		const observer = new MutationObserver(calculateHeight);
		if (document.body) {
			observer.observe(document.body, {
				childList: true,
				subtree: true,
				attributes: true,
				attributeFilter: ['class', 'style'],
			});
		}

		return () => {
			window.removeEventListener('resize', handleResize);
			observer.disconnect();
		};
	}, []);

	/**
	 * Handles tab selection and updates the active canvas
	 * @param {number} tabId - The ID of the selected canvas tab
	 */
	const handleTabChange = (tabId) => {
		setActiveTab(tabId);
		// Scroll to top when changing canvas tabs
		window.scrollTo(0, 0);
		// Also ensure the content container is scrolled to top
		if (contentRef.current) {
			contentRef.current.scrollTop = 0;
		}
	};

	return (
		<div ref={containerRef} className="flex flex-col w-full h-screen min-h-0">
			{/* Tab navigation - positioned with proper z-index and marked for export hiding */}
			<div className="absolute top-4 right-4 flex space-x-2 z-40" data-ui-element="true" data-export-hide="true">
				{canvases.map((canvas) => (
					<button
						key={canvas.id}
						className={`px-4 py-2 rounded-lg transition-colors shadow-lg ${
							activeTab === canvas.id
								? 'bg-blue-500 text-white'
								: 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
						}`}
						onClick={() => handleTabChange(canvas.id)}
					>
						{canvas.name}
					</button>
				))}
			</div>

			{/* Canvas container - fills the calculated available space */}
			<div ref={contentRef} className="w-full h-full">
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
 * - Sets up the initial canvas data (3 canvases with simple names by default)
 * - Loads canvas data from Firestore if user is logged in
 * - Provides the CanvasDataProvider context to child components
 * - Renders the CanvasDataContent with appropriate context
 *
 * @returns {JSX.Element} The fully contextualized canvas page
 */
export default function Canvas() {
	// Default initial canvas configuration (used when no user is logged in or no saved data)
	const defaultCanvases = [
		{ id: 0, name: '1', data: { elements: [], connections: [], arrows: [] } },
		{ id: 1, name: '2', data: { elements: [], connections: [], arrows: [] } },
		{ id: 2, name: '3', data: { elements: [], connections: [], arrows: [] } },
	];

	const { currentUser } = useAuth(); // Get current user from auth context

	// Scroll to top when component mounts
	useEffect(() => {
		window.scrollTo(0, 0);
	}, []);

	return (
		<div className="w-full">
			<CanvasDataProvider initialCanvases={defaultCanvases} currentUser={currentUser}>
				<CanvasDataContent />
			</CanvasDataProvider>
		</div>
	);
}
