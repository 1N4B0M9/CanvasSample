import React from 'react';
import PropTypes from 'prop-types';

// small HUD showing current zoom level with zoom in/out/reset controls
const ViewportHUD = ({ zoom, onZoomIn, onZoomOut, onReset }) => (
		<div className="bg-white rounded-lg shadow border border-gray-200 px-2 py-1 flex items-center gap-1" style={{ zIndex: 50 }}>
			<button
				className="w-6 h-6 flex items-center justify-center rounded hover:bg-gray-100 text-gray-600 text-sm font-semibold"
				onClick={onZoomOut}
				title="Zoom out"
			>
				−
			</button>
			<button
				className="min-w-[44px] text-center text-xs font-medium text-gray-700 hover:bg-gray-100 rounded px-1 py-0.5"
				onClick={onReset}
				title="Reset zoom and position"
			>
				{Math.round(zoom * 100)}%
			</button>
			<button
				className="w-6 h-6 flex items-center justify-center rounded hover:bg-gray-100 text-gray-600 text-sm font-semibold"
				onClick={onZoomIn}
				title="Zoom in"
			>
				+
			</button>
			<span className="ml-2 text-xs text-gray-400 hidden sm:block">Space+drag · Ctrl+scroll</span>
		</div>
	);

ViewportHUD.propTypes = {
	zoom: PropTypes.number.isRequired,
	onZoomIn: PropTypes.func.isRequired,
	onZoomOut: PropTypes.func.isRequired,
	onReset: PropTypes.func.isRequired,
};

export default ViewportHUD;
