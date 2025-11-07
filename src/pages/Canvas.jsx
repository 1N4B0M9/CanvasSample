/**
 * Canvas.jsx - Fixed to Account for Navbar/Footer Layout
 */
import React, { useState, useEffect, useRef } from 'react';
import { doc, getDoc, collection } from 'firebase/firestore';
import RenderCanvas from '../components/Canvas/Layout/RenderCanvas';
import { CanvasDataProvider, useCanvasData } from '../components/Canvas/Utils/CanvasDataContext';
import { db } from '../firebase/firebase';
import { useAuth } from '../firebase/AuthContext';

const CanvasDataContent = () => {
	const [activeTab, setActiveTab] = useState(0);
	const [availableHeight, setAvailableHeight] = useState('100vh');
	const { canvases, loading, loadError } = useCanvasData(); // ← use error flag
	const contentRef = useRef(null);
	const containerRef = useRef(null);

	useEffect(() => {
		const calculateHeight = () => {
			const navbar =
				document.querySelector('header[class*="MuiAppBar"]') ||
				document.querySelector('nav') ||
				document.querySelector('[class*="navbar"]');
			const navbarHeight = navbar ? navbar.offsetHeight : 64;
			const windowHeight = window.innerHeight;
			const calculatedHeight = windowHeight - navbarHeight;
			setAvailableHeight(`${calculatedHeight}px`);
		};
		calculateHeight();
		const handleResize = () => {
			setTimeout(calculateHeight, 100);
		};
		window.addEventListener('resize', handleResize);
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

	const handleTabChange = (tabId) => {
		setActiveTab(tabId);
		window.scrollTo(0, 0);
		if (contentRef.current) {
			contentRef.current.scrollTop = 0;
		}
	};

	// Initial loading UI
	if (loading) {
		return (
			<div className="w-full h-screen flex items-center justify-center">
				<span className="text-gray-600">Loading…</span>
			</div>
		);
	}

	// Cloud load failure UI (prevents immediate overwrite since autosave is gated by loadedFromStorage)
	if (loadError) {
		return (
			<div className="w-full h-screen flex items-center justify-center">
				<div className="text-center space-y-2">
					<p className="text-red-600 font-medium">Failed to load from cloud.</p>
					<p className="text-gray-600">Showing local/default copy. Try refresh when you’re back online.</p>
				</div>
			</div>
		);
	}

	return (
		<div ref={containerRef} className="flex flex-col w-full h-screen min-h-0">
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

export default function Canvas() {
	const defaultCanvases = [
		{ id: 0, name: '1', data: { elements: [], connections: [], arrows: [] } },
		{ id: 1, name: '2', data: { elements: [], connections: [], arrows: [] } },
		{ id: 2, name: '3', data: { elements: [], connections: [], arrows: [] } },
	];

	const { currentUser } = useAuth();

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
