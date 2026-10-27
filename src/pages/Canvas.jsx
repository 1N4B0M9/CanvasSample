import React, { useState, useEffect } from 'react';
import RenderCanvas from '../components/Canvas/Layout/RenderCanvas';
import { CanvasDataProvider, useCanvasData } from '../components/Canvas/Utils/CanvasDataContext';
import { useAuth } from '../firebase/AuthContext';

const CanvasDataContent = () => {
	const [activeTab, setActiveTab] = useState(0);
	const { canvases, loading, loadError } = useCanvasData(); // ← use error flag

	useEffect(() => {
		const html = document.documentElement;
		const body = document.body;
		const previousHtmlOverflow = html.style.overflow;
		const previousBodyOverflow = body.style.overflow;
		const supportsOverflowClip = typeof CSS !== 'undefined' && CSS.supports('overflow', 'clip');
		const overflowValue = supportsOverflowClip ? 'clip' : 'hidden';
		const resetPageScroll = () => {
			if (html.scrollLeft || html.scrollTop) {
				html.scrollLeft = 0;
				html.scrollTop = 0;
			}
			if (body.scrollLeft || body.scrollTop) {
				body.scrollLeft = 0;
				body.scrollTop = 0;
			}
		};

		html.style.overflow = overflowValue;
		body.style.overflow = overflowValue;
		if (!supportsOverflowClip) {
			html.addEventListener('scroll', resetPageScroll, { passive: true });
			body.addEventListener('scroll', resetPageScroll, { passive: true });
		}

		return () => {
			html.removeEventListener('scroll', resetPageScroll);
			body.removeEventListener('scroll', resetPageScroll);
			html.style.overflow = previousHtmlOverflow;
			body.style.overflow = previousBodyOverflow;
		};
	}, []);

	const supportsOverflowClip = typeof CSS !== 'undefined' && CSS.supports('overflow', 'clip');

	const handleTabChange = (tabId) => {
		setActiveTab(tabId);
	};

	// Initial loading UI
	if (loading) {
		return (
			<div className="w-full h-[100dvh] flex items-center justify-center">
				<span className="text-gray-600">Loading…</span>
			</div>
		);
	}

	// Cloud load failure UI (prevents immediate overwrite since autosave is gated by loadedFromStorage)
	if (loadError) {
		return (
			<div className="w-full h-[100dvh] flex items-center justify-center">
				<div className="text-center space-y-2">
					<p className="text-red-600 font-medium">Failed to load from cloud.</p>
					<p className="text-gray-600">Showing local/default copy. Try refresh when you’re back online.</p>
				</div>
			</div>
		);
	}

	return (
		<div className={`fixed inset-0 min-h-0 ${supportsOverflowClip ? 'overflow-clip' : 'overflow-hidden'}`}>
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

			<div className="w-full h-full min-h-0">
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
