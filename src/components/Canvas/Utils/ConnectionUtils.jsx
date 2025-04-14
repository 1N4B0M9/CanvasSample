/**
 * Shared utilities for connections, arrows, and other connection-like elements
 * Enhanced to properly handle CSS transform scale and rotation
 */

/**
 * Applies rotation transformation to a point
 *
 * @param {number} x - Original x coordinate
 * @param {number} y - Original y coordinate
 * @param {number} centerX - Rotation center x coordinate
 * @param {number} centerY - Rotation center y coordinate
 * @param {number} angleDeg - Rotation angle in degrees
 * @returns {Object} Rotated {x, y} coordinates
 */
const rotatePoint = (x, y, centerX, centerY, angleDeg) => {
	// Convert angle to radians
	const angleRad = (angleDeg * Math.PI) / 180;

	// Translate point to origin
	const translatedX = x - centerX;
	const translatedY = y - centerY;

	// Rotate point
	const rotatedX = translatedX * Math.cos(angleRad) - translatedY * Math.sin(angleRad);
	const rotatedY = translatedX * Math.sin(angleRad) + translatedY * Math.cos(angleRad);

	// Translate point back
	return {
		x: rotatedX + centerX,
		y: rotatedY + centerY,
	};
};

/**
 * Calculate the intersection point of a line with a rectangle's border
 * This accounts for both rotation and CSS scale transforms
 *
 * @param {Object} element - The element with position, dimensions, and rotation/scale
 * @param {number} fromX - Source point x coordinate
 * @param {number} fromY - Source point y coordinate
 * @returns {Object} Intersection point {x, y} on the element border
 */
export const calculateElementBorderIntersection = (element, fromX, fromY) => {
	// With CSS transforms, the base dimensions remain unchanged - the visual size changes
	const baseWidth = element.width;
	const baseHeight = element.height;

	// Calculate the visual scale - this matches how it's applied in CSS
	const scale = element.scale || 1;

	// Calculate visual width and height after scaling
	const scaledWidth = baseWidth * scale;
	const scaledHeight = baseHeight * scale;

	// Important: In CSS transforms, the position (x,y) remains at the top-left,
	// but the scaling happens from the center

	// Calculate actual center point (accounting for the fact that scaling happens from center)
	const centerX = element.x + baseWidth / 2;
	const centerY = element.y + baseHeight / 2;

	// If element has rotation, transform the source point to element's coordinate system
	let localFromX = fromX;
	let localFromY = fromY;

	if (element.rotation !== 0) {
		const rotated = rotatePoint(fromX, fromY, centerX, centerY, -element.rotation);
		localFromX = rotated.x;
		localFromY = rotated.y;
	}

	// Calculate vector from center to the source point
	const dx = localFromX - centerX;
	const dy = localFromY - centerY;

	// Normalize direction vector
	const length = Math.sqrt(dx * dx + dy * dy);
	const dirX = length > 0 ? dx / length : 1;
	const dirY = length > 0 ? dy / length : 0;

	// Calculate the half dimensions of the scaled element
	const halfScaledWidth = scaledWidth / 2;
	const halfScaledHeight = scaledHeight / 2;

	// Calculate the intersection with the border
	// We compute how far along the direction vector we need to go to hit the border
	const tx = dirX !== 0 ? Math.abs(halfScaledWidth / dirX) : Infinity;
	const ty = dirY !== 0 ? Math.abs(halfScaledHeight / dirY) : Infinity;

	// Take the smaller of tx and ty to get the first intersection
	const t = Math.min(tx, ty);

	// Use the sign of the direction to determine which side we're hitting
	// For x: positive = right border, negative = left border
	// For y: positive = bottom border, negative = top border
	const signX = Math.sign(dirX);
	const signY = Math.sign(dirY);

	// Calculate the intersection point based on whether we're hitting the vertical or horizontal edge
	let intersectX;
	let intersectY;

	if (t === tx) {
		// Hitting left or right edge
		intersectX = centerX + signX * halfScaledWidth;
		intersectY = centerY + dirY * t;
	} else {
		// Hitting top or bottom edge
		intersectX = centerX + dirX * t;
		intersectY = centerY + signY * halfScaledHeight;
	}

	// If element has rotation, rotate the intersection point back to world coordinates
	if (element.rotation !== 0) {
		const rotated = rotatePoint(intersectX, intersectY, centerX, centerY, element.rotation);
		intersectX = rotated.x;
		intersectY = rotated.y;
	}

	return { x: intersectX, y: intersectY };
};

/**
 * Calculate the coordinates for a connection between two elements
 * Improved to handle both rotation and CSS scale transforms
 *
 * @param {Array} elements - Array of all canvas elements
 * @param {string} startId - ID of the starting element
 * @param {string} endId - ID of the ending element
 * @returns {Object|null} Connection points or null if elements not found
 */
export const calculateConnectionPoints = (elements, startId, endId) => {
	const startElement = elements.find((el) => el.id === startId);
	const endElement = elements.find((el) => el.id === endId);

	if (!startElement || !endElement) return null;

	// Calculate element centers
	const startCenterX = startElement.x + startElement.width / 2;
	const startCenterY = startElement.y + startElement.height / 2;
	const endCenterX = endElement.x + endElement.width / 2;
	const endCenterY = endElement.y + endElement.height / 2;

	// Calculate intersection points on element borders
	const startPoint = calculateElementBorderIntersection(startElement, endCenterX, endCenterY);
	const endPoint = calculateElementBorderIntersection(endElement, startCenterX, startCenterY);

	// Calculate angle for directional indicators like arrows
	const angle = Math.atan2(endPoint.y - startPoint.y, endPoint.x - startPoint.x);

	return {
		startX: startPoint.x,
		startY: startPoint.y,
		endX: endPoint.x,
		endY: endPoint.y,
		angle,
		startElement,
		endElement,
	};
};

/**
 * Calculate the coordinates for a temporary connection from an element to the mouse
 *
 * @param {Object} element - The element data
 * @param {number} mouseX - Mouse X position
 * @param {number} mouseY - Mouse Y position
 * @returns {Object|null} Connection points or null if element not found
 */
export const calculateTempConnectionPoints = (element, mouseX, mouseY) => {
	if (!element) return null;

	// Calculate intersection point on element border
	const startPoint = calculateElementBorderIntersection(element, mouseX, mouseY);

	// Calculate angle
	const angle = Math.atan2(mouseY - startPoint.y, mouseX - startPoint.x);

	return {
		startX: startPoint.x,
		startY: startPoint.y,
		endX: mouseX,
		endY: mouseY,
		angle,
		element,
	};
};

/**
 * Calculate arrowhead points for directional connections
 *
 * @param {number} endX - Arrow end X coordinate
 * @param {number} endY - Arrow end Y coordinate
 * @param {number} angle - Arrow angle in radians
 * @param {number} size - Arrow size
 * @returns {Object} Arrow points coordinates
 */
export const calculateArrowHead = (endX, endY, angle, size = 12) => {
	const arrowAngle = Math.PI / 6; // 30 degrees

	// Calculate arrow points
	const x1 = endX - size * Math.cos(angle - arrowAngle);
	const y1 = endY - size * Math.sin(angle - arrowAngle);
	const x2 = endX - size * Math.cos(angle + arrowAngle);
	const y2 = endY - size * Math.sin(angle + arrowAngle);

	return { x1, y1, x2, y2 };
};
