// Import this into your CustomCanvas component
const useConnections = (elements, canvasRef) => {
	// Calculate connection coordinates directly from DOM elements
	const getConnectionCoordinates = (connection) => {
		// Find the elements in the DOM
		const startEl = document.querySelector(`[data-element-id="${connection.startId}"]`);
		const endEl = document.querySelector(`[data-element-id="${connection.endId}"]`);

		if (!startEl || !endEl || !canvasRef.current) return null;

		// Get canvas position for offset calculation
		const canvasRect = canvasRef.current.getBoundingClientRect();

		// Get the actual rendered rectangles of the elements
		const startRect = startEl.getBoundingClientRect();
		const endRect = endEl.getBoundingClientRect();

		// Calculate positions relative to canvas
		const startBounds = {
			left: startRect.left - canvasRect.left,
			right: startRect.right - canvasRect.left,
			top: startRect.top - canvasRect.top,
			bottom: startRect.bottom - canvasRect.top,
			centerX: (startRect.left + startRect.right) / 2 - canvasRect.left,
			centerY: (startRect.top + startRect.bottom) / 2 - canvasRect.top,
			width: startRect.width,
			height: startRect.height,
		};

		const endBounds = {
			left: endRect.left - canvasRect.left,
			right: endRect.right - canvasRect.left,
			top: endRect.top - canvasRect.top,
			bottom: endRect.bottom - canvasRect.top,
			centerX: (endRect.left + endRect.right) / 2 - canvasRect.left,
			centerY: (endRect.top + endRect.bottom) / 2 - canvasRect.top,
			width: endRect.width,
			height: endRect.height,
		};

		// Determine which sides to connect based on relative positions
		const dx = endBounds.centerX - startBounds.centerX;
		const dy = endBounds.centerY - startBounds.centerY;

		// Calculate angle between centers (in degrees)
		const angleDeg = ((Math.atan2(dy, dx) * 180) / Math.PI + 360) % 360;

		let startX;
		let startY;
		let endX;
		let endY;

		// Determine connection points based on angle
		if (angleDeg >= 45 && angleDeg < 135) {
			// Connect bottom of start to top of end
			startX = startBounds.centerX;
			startY = startBounds.bottom;
			endX = endBounds.centerX;
			endY = endBounds.top;
		} else if (angleDeg >= 135 && angleDeg < 225) {
			// Connect left of start to right of end
			startX = startBounds.left;
			startY = startBounds.centerY;
			endX = endBounds.right;
			endY = endBounds.centerY;
		} else if (angleDeg >= 225 && angleDeg < 315) {
			// Connect top of start to bottom of end
			startX = startBounds.centerX;
			startY = startBounds.top;
			endX = endBounds.centerX;
			endY = endBounds.bottom;
		} else {
			// Connect right of start to left of end
			startX = startBounds.right;
			startY = startBounds.centerY;
			endX = endBounds.left;
			endY = endBounds.centerY;
		}

		return { startX, startY, endX, endY };
	};

	// Calculate temporary connection when dragging
	const getTempConnectionPoint = (elementId, mouseX, mouseY) => {
		if (!elementId || !canvasRef.current) return null;

		const el = document.querySelector(`[data-element-id="${elementId}"]`);
		if (!el) return null;

		// Get canvas position
		const canvasRect = canvasRef.current.getBoundingClientRect();

		// Get element rectangle
		const rect = el.getBoundingClientRect();

		// Calculate element bounds relative to canvas
		const bounds = {
			left: rect.left - canvasRect.left,
			right: rect.right - canvasRect.left,
			top: rect.top - canvasRect.top,
			bottom: rect.bottom - canvasRect.top,
			centerX: (rect.left + rect.right) / 2 - canvasRect.left,
			centerY: (rect.top + rect.bottom) / 2 - canvasRect.top,
		};

		// Calculate angle to mouse
		const dx = mouseX - bounds.centerX;
		const dy = mouseY - bounds.centerY;
		const angleDeg = ((Math.atan2(dy, dx) * 180) / Math.PI + 360) % 360;

		let startX;
		let startY;

		// Determine connection point based on angle
		if (angleDeg >= 45 && angleDeg < 135) {
			// Connect from bottom
			startX = bounds.centerX;
			startY = bounds.bottom;
		} else if (angleDeg >= 135 && angleDeg < 225) {
			// Connect from left
			startX = bounds.left;
			startY = bounds.centerY;
		} else if (angleDeg >= 225 && angleDeg < 315) {
			// Connect from top
			startX = bounds.centerX;
			startY = bounds.top;
		} else {
			// Connect from right
			startX = bounds.right;
			startY = bounds.centerY;
		}

		return { startX, startY };
	};

	return { getConnectionCoordinates, getTempConnectionPoint };
};

export default useConnections;
