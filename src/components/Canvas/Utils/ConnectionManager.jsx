/**
 * ConnectionManager utility class to handle canvas element connections
 * This abstracts all connection-related logic
 */
class ConnectionManager {
	constructor(elements) {
		this.elements = elements;
		this.connectionPoints = new Map(); // Store connection points for each element
	}

	/**
	 * Update element dimensions when they change
	 * @param {String} elementId - The ID of the element that changed
	 * @param {Object} dimensions - The new dimensions
	 */
	updateElementDimensions(elementId, dimensions) {
		this.connectionPoints.set(elementId, dimensions);
	}

	/**
	 * Get the most up-to-date element dimensions
	 * @param {Object} element - The element object
	 * @returns {Object} - The element with updated dimensions if available
	 */
	getElementWithUpdatedDimensions(element) {
		const cachedDimensions = this.connectionPoints.get(element.id);

		if (cachedDimensions) {
			return {
				...element,
				width: cachedDimensions.width || element.width,
				height: cachedDimensions.height || element.height,
			};
		}

		return element;
	}

	/**
	 * Calculate connection coordinates between two elements
	 * @param {Object} connection - The connection object containing startId and endId
	 * @returns {Object|null} - Connection coordinate points or null if elements not found
	 */
	getConnectionCoordinates(connection) {
		const startElement = this.elements.find((el) => el.id === connection.startId);
		const endElement = this.elements.find((el) => el.id === connection.endId);

		if (!startElement || !endElement) return null;

		// Get most up-to-date element dimensions
		const updatedStartElement = this.getElementWithUpdatedDimensions(startElement);
		const updatedEndElement = this.getElementWithUpdatedDimensions(endElement);

		// Get actual element dimensions after scaling
		const startWidth = updatedStartElement.width * updatedStartElement.scale;
		const startHeight = updatedStartElement.height * updatedStartElement.scale;
		const endWidth = updatedEndElement.width * updatedEndElement.scale;
		const endHeight = updatedEndElement.height * updatedEndElement.scale;

		// Calculate element centers
		const startCenterX = updatedStartElement.x + startWidth / 2;
		const startCenterY = updatedStartElement.y + startHeight / 2;
		const endCenterX = updatedEndElement.x + endWidth / 2;
		const endCenterY = updatedEndElement.y + endHeight / 2;

		// Calculate element bounds
		const startBounds = {
			left: updatedStartElement.x,
			right: updatedStartElement.x + startWidth,
			top: updatedStartElement.y,
			bottom: updatedStartElement.y + startHeight,
			centerX: startCenterX,
			centerY: startCenterY,
		};

		const endBounds = {
			left: updatedEndElement.x,
			right: updatedEndElement.x + endWidth,
			top: updatedEndElement.y,
			bottom: updatedEndElement.y + endHeight,
			centerX: endCenterX,
			centerY: endCenterY,
		};

		// Calculate angle between centers to determine optimal connection points
		const dx = endCenterX - startCenterX;
		const dy = endCenterY - startCenterY;
		const angle = Math.atan2(dy, dx);
		const angleDeg = ((angle * 180) / Math.PI + 360) % 360;

		// Determine connection points based on angle
		return this._determineConnectionPoints(angleDeg, startBounds, endBounds);
	}

	/**
	 * Calculate temporary connection coordinates when drawing a connection
	 * @param {Object} startElement - The element to start the connection from
	 * @param {number} mouseX - Current mouse X position
	 * @param {number} mouseY - Current mouse Y position
	 * @returns {Object|null} - Connection start coordinates or null if element not found
	 */
	getTempConnectionCoordinates(startElement, mouseX, mouseY) {
		if (!startElement) return null;

		// Get actual element dimensions after scaling
		const elementWidth = startElement.width * startElement.scale;
		const elementHeight = startElement.height * startElement.scale;

		// Calculate element center
		const centerX = startElement.x + elementWidth / 2;
		const centerY = startElement.y + elementHeight / 2;

		// Calculate element bounds
		const bounds = {
			left: startElement.x,
			right: startElement.x + elementWidth,
			top: startElement.y,
			bottom: startElement.y + elementHeight,
			centerX,
			centerY,
		};

		// Calculate angle to mouse cursor
		const dx = mouseX - centerX;
		const dy = mouseY - centerY;
		const angle = Math.atan2(dy, dx);
		const angleDeg = ((angle * 180) / Math.PI + 360) % 360;

		// Determine connection point based on angle to mouse
		let startX;
		let startY;

		if (angleDeg >= 45 && angleDeg < 135) {
			// Connect from bottom of element
			startX = bounds.centerX;
			startY = bounds.bottom;
		} else if (angleDeg >= 135 && angleDeg < 225) {
			// Connect from left of element
			startX = bounds.left;
			startY = bounds.centerY;
		} else if (angleDeg >= 225 && angleDeg < 315) {
			// Connect from top of element
			startX = bounds.centerX;
			startY = bounds.top;
		} else {
			// Connect from right of element (angleDeg >= 315 || angleDeg < 45)
			startX = bounds.right;
			startY = bounds.centerY;
		}

		return { startX, startY };
	}

	/**
	 * Determine optimal connection points between two elements based on angle
	 * @param {number} angleDeg - Angle in degrees between elements
	 * @param {Object} startBounds - Bounds of the start element
	 * @param {Object} endBounds - Bounds of the end element
	 * @returns {Object} - Connection coordinate points
	 */
	_determineConnectionPoints(angleDeg, startBounds, endBounds) {
		let startX;
		let startY;
		let endX;
		let endY;

		// Determine start point (which side of the start element)
		if (angleDeg >= 45 && angleDeg < 135) {
			// Connect from bottom of start element
			startX = startBounds.centerX;
			startY = startBounds.bottom;
		} else if (angleDeg >= 135 && angleDeg < 225) {
			// Connect from left of start element
			startX = startBounds.left;
			startY = startBounds.centerY;
		} else if (angleDeg >= 225 && angleDeg < 315) {
			// Connect from top of start element
			startX = startBounds.centerX;
			startY = startBounds.top;
		} else {
			// Connect from right of start element (angleDeg >= 315 || angleDeg < 45)
			startX = startBounds.right;
			startY = startBounds.centerY;
		}

		// Determine end point (which side of the end element)
		// We use the opposite direction for the end element
		if (angleDeg >= 45 && angleDeg < 135) {
			// Connect to top of end element
			endX = endBounds.centerX;
			endY = endBounds.top;
		} else if (angleDeg >= 135 && angleDeg < 225) {
			// Connect to right of end element
			endX = endBounds.right;
			endY = endBounds.centerY;
		} else if (angleDeg >= 225 && angleDeg < 315) {
			// Connect to bottom of end element
			endX = endBounds.centerX;
			endY = endBounds.bottom;
		} else {
			// Connect to left of end element (angleDeg >= 315 || angleDeg < 45)
			endX = endBounds.left;
			endY = endBounds.centerY;
		}

		return { startX, startY, endX, endY };
	}
}

export default ConnectionManager;
