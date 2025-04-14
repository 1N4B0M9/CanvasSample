/**
 * ConnectionUtils.js - Utility functions for calculating connection points between elements
 *
 * This version correctly aligns with how CSS transformations (rotate and scale) are applied
 * in the CanvasElement component, ensuring connection points attach properly to visually
 * transformed elements.
 */

/**
 * Simple rotation function that rotates a point around a center
 */
const rotatePoint = (x, y, centerX, centerY, angleDeg) => {
	const angleRad = (angleDeg * Math.PI) / 180;
	const dx = x - centerX;
	const dy = y - centerY;

	return {
		x: centerX + dx * Math.cos(angleRad) - dy * Math.sin(angleRad),
		y: centerY + dx * Math.sin(angleRad) + dy * Math.cos(angleRad),
	};
};

/**
 * Calculate the intersection point of a line from the element center to a target point
 * with the element's border, accounting for both rotation and scaling
 */
export const calculateElementBorderIntersection = (element, targetX, targetY) => {
	// Get basic element properties
	const { x, y, width, height, rotation = 0, scale = 1 } = element;

	// Calculate center of element (transform origin)
	const centerX = x + width / 2;
	const centerY = y + height / 2;

	// Step 1: Inverse-transform the target point to account for element's rotation
	// This converts the target to the element's local coordinate system before rotation
	let localTargetX = targetX;
	let localTargetY = targetY;

	if (rotation !== 0) {
		const rotated = rotatePoint(targetX, targetY, centerX, centerY, -rotation);
		localTargetX = rotated.x;
		localTargetY = rotated.y;
	}

	// Step 2: Calculate the vector from center to the inverse-transformed target
	const dx = localTargetX - centerX;
	const dy = localTargetY - centerY;

	// Normalize the direction vector
	const distance = Math.sqrt(dx * dx + dy * dy);
	const dirX = distance !== 0 ? dx / distance : 1; // Default to right if at center
	const dirY = distance !== 0 ? dy / distance : 0;

	// Step 3: Calculate the unscaled half-width and half-height
	const halfWidth = (width * scale) / 2;
	const halfHeight = (height * scale) / 2;

	// Step 4: Calculate the distance from center to border along the direction vector

	// For each axis, calculate t values where ray intersects with rectangle borders
	const tValues = [];

	// Horizontal borders
	if (dirY !== 0) {
		tValues.push((halfHeight / Math.abs(dirY)) * (dirY > 0 ? 1 : -1));
		tValues.push((-halfHeight / Math.abs(dirY)) * (dirY > 0 ? 1 : -1));
	}

	// Vertical borders
	if (dirX !== 0) {
		tValues.push((halfWidth / Math.abs(dirX)) * (dirX > 0 ? 1 : -1));
		tValues.push((-halfWidth / Math.abs(dirX)) * (dirX > 0 ? 1 : -1));
	}

	// Find the smallest positive t value (closest intersection in ray direction)
	let t = Infinity;
	for (const tVal of tValues) {
		if (tVal > 0 && tVal < t) {
			t = tVal;
		}
	}

	// If no intersection found (shouldn't happen), use the center
	if (!isFinite(t)) {
		return { x: centerX, y: centerY };
	}

	// Step 5: Calculate the intersection point in unrotated space
	let intersectX = centerX + dirX * t;
	let intersectY = centerY + dirY * t;

	// Step 6: Apply rotation to the intersection point to get world coordinates
	if (rotation !== 0) {
		const rotated = rotatePoint(intersectX, intersectY, centerX, centerY, rotation);
		intersectX = rotated.x;
		intersectY = rotated.y;
	}

	// Return the final intersection point
	return { x: intersectX, y: intersectY };
};

/**
 * Calculate the coordinates for a connection between two elements
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

	// Calculate the intersection points
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
