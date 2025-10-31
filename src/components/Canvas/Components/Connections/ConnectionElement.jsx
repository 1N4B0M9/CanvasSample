/**
 * Connection Component Hierarchy
 *
 * This file defines a set of specialized connection components:
 * 1. BaseConnection - Core shared SVG rendering functionality
 * 2. FullConnection - Renders permanent standard connections
 * 3. Arrow - Renders permanent arrows
 * 4. TempConnection - Renders temporary standard connections
 * 5. TempArrow - Renders temporary arrows
 */

import React from 'react';
import {
	calculateConnectionPoints,
	calculateTempConnectionPoints,
	calculateArrowHead,
} from '../../Utils/ConnectionUtils';

/**
 * BaseConnection Component
 *
 * Shared base component that handles common connection rendering logic.
 * Not used directly - serves as a foundation for specialized connection components.
 */
const BaseConnection = ({
	startX,
	startY,
	endX,
	endY,
	color = 'black',
	thickness = 2,
	dashArray = '',
	isSelected = false,
	showStartMarker = true,
	showEndMarker = true,
	children,
	...svgProps
}) => {
	const selectedColor = '#3b82f6';
	const displayColor = isSelected ? selectedColor : color;
	const displayThickness = isSelected ? thickness + 1 : thickness;
	const displayDashArray = isSelected ? '5,3' : dashArray;

	return (
		<svg className="absolute top-0 left-0 w-full h-full" style={{ zIndex: 0 }} pointerEvents="none" {...svgProps}>
			{/* Visible connection line */}
			<line
				x1={startX}
				y1={startY}
				x2={endX}
				y2={endY}
				stroke={displayColor}
				strokeWidth={displayThickness}
				strokeDasharray={displayDashArray}
			/>

			{/* Connection endpoint markers */}
			{showStartMarker && <circle cx={startX} cy={startY} r={3} fill={displayColor} />}

			{showEndMarker && <circle cx={endX} cy={endY} r={3} fill={displayColor} />}

			{children}
		</svg>
	);
};

/**
 * FullConnection Component
 *
 * Renders a permanent standard connection between two elements.
 */
export const FullConnection = ({ connection, elements, isSelected = false, onSelect, onDelete }) => {
	if (!connection || !elements) return null;

	// Calculate connection points
	const points = calculateConnectionPoints(elements, connection.startId, connection.endId);
	if (!points) return null;

	const { startX, startY, endX, endY } = points;

	// Calculate the midpoint for the delete button
	const midX = (startX + endX) / 2;
	const midY = (startY + endY) / 2;

	return (
		<>
			{/* Invisible wider line for easier selection */}
			<svg className="absolute top-0 left-0 w-full h-full" style={{ zIndex: 0 }} pointerEvents="none">
				<line
					x1={startX}
					y1={startY}
					x2={endX}
					y2={endY}
					stroke="transparent"
					strokeWidth={10}
					style={{ cursor: 'pointer' }}
					pointerEvents="auto"
					onClick={(e) => {
						e.stopPropagation();
						onSelect(connection.id, e);
					}}
				/>
			</svg>

			<BaseConnection
				startX={startX}
				startY={startY}
				endX={endX}
				endY={endY}
				color={connection.color || 'black'}
				thickness={connection.thickness || 2}
				isSelected={isSelected}
			>
				{/* Delete button for selected connection */}
				{isSelected && (
					<g pointerEvents="auto">
						{/* Background circle */}
						<circle
							cx={midX}
							cy={midY}
							r={12}
							fill="white"
							stroke="#ef4444"
							strokeWidth={1}
							style={{ cursor: 'pointer' }}
							onClick={(e) => {
								e.stopPropagation();
								e.preventDefault();
								onDelete(connection.id);
								return false;
							}}
						/>

						{/* X symbol */}
						<line
							x1={midX - 5}
							y1={midY - 5}
							x2={midX + 5}
							y2={midY + 5}
							stroke="#ef4444"
							strokeWidth={2}
							style={{ cursor: 'pointer' }}
							onClick={(e) => {
								e.stopPropagation();
								e.preventDefault();
								onDelete(connection.id);
								return false;
							}}
						/>
						<line
							x1={midX + 5}
							y1={midY - 5}
							x2={midX - 5}
							y2={midY + 5}
							stroke="#ef4444"
							strokeWidth={2}
							style={{ cursor: 'pointer' }}
							onClick={(e) => {
								e.stopPropagation();
								e.preventDefault();
								onDelete(connection.id);
								return false;
							}}
						/>
					</g>
				)}

				{/* Data Display Label (if connection has data payload) */}
				{connection.data && (
					<g>
						<rect
							x={midX - 40}
							y={midY - 15}
							width={80}
							height={30}
							rx={6}
							ry={6}
							fill="white"
							stroke={isSelected ? '#3b82f6' : connection.color || 'black'}
							strokeWidth={1}
							onClick={(e) => onSelect(connection.id, e)}
						/>
						<text
							x={midX}
							y={midY + 5}
							textAnchor="middle"
							fontSize={12}
							fill={isSelected ? '#3b82f6' : connection.color || 'black'}
							onClick={(e) => onSelect(connection.id, e)}
							style={{ pointerEvents: 'none' }}
						>
							{typeof connection.data === 'object'
								? JSON.stringify(connection.data).substring(0, 15) +
									(JSON.stringify(connection.data).length > 15 ? '...' : '')
								: String(connection.data).substring(0, 15) + (String(connection.data).length > 15 ? '...' : '')}
						</text>
					</g>
				)}
			</BaseConnection>
		</>
	);
};

/**
 * Arrow Component
 *
 * Renders a permanent arrow connection between two elements.
 */
export const Arrow = ({ connection, elements, isSelected = false, onSelect, onDelete }) => {
	if (!connection || !elements) return null;

	// Calculate connection points
	const points = calculateConnectionPoints(elements, connection.startId, connection.endId);
	if (!points) return null;

	const { startX, startY, endX, endY, angle } = points;

	// Calculate the midpoint for the delete button
	const midX = (startX + endX) / 2;
	const midY = (startY + endY) / 2;

	// Calculate arrow head
	const arrowHead = calculateArrowHead(endX, endY, angle, 14);

	return (
		<>
			{/* Invisible wider line for easier selection */}
			<svg className="absolute top-0 left-0 w-full h-full" style={{ zIndex: 0 }} pointerEvents="none">
				<line
					x1={startX}
					y1={startY}
					x2={endX}
					y2={endY}
					stroke="transparent"
					strokeWidth={10}
					style={{ cursor: 'pointer' }}
					pointerEvents="auto"
					onClick={(e) => {
						e.stopPropagation();
						onSelect(connection.id, e);
					}}
				/>
			</svg>

			<BaseConnection
				startX={startX}
				startY={startY}
				endX={endX}
				endY={endY}
				color={connection.color || 'black'}
				thickness={connection.thickness || 2}
				isSelected={isSelected}
				showEndMarker={false}
			>
				{/* Arrow Head */}
				<polygon
					points={`${endX},${endY} ${arrowHead.x1},${arrowHead.y1} ${arrowHead.x2},${arrowHead.y2}`}
					fill={isSelected ? '#3b82f6' : connection.color || 'black'}
					style={{ cursor: 'pointer' }}
					pointerEvents="auto"
					onClick={(e) => {
						e.stopPropagation();
						onSelect(connection.id, e);
					}}
				/>

				{/* Delete button for selected connection */}
				{isSelected && (
					<g pointerEvents="auto">
						{/* Background circle */}
						<circle
							cx={midX}
							cy={midY}
							r={12}
							fill="white"
							stroke="#ef4444"
							strokeWidth={1}
							style={{ cursor: 'pointer' }}
							onClick={(e) => {
								e.stopPropagation();
								e.preventDefault();
								onDelete(connection.id);
								return false;
							}}
						/>

						{/* X symbol */}
						<line
							x1={midX - 5}
							y1={midY - 5}
							x2={midX + 5}
							y2={midY + 5}
							stroke="#ef4444"
							strokeWidth={2}
							style={{ cursor: 'pointer' }}
							onClick={(e) => {
								e.stopPropagation();
								e.preventDefault();
								onDelete(connection.id);
								return false;
							}}
						/>
						<line
							x1={midX + 5}
							y1={midY - 5}
							x2={midX - 5}
							y2={midY + 5}
							stroke="#ef4444"
							strokeWidth={2}
							style={{ cursor: 'pointer' }}
							onClick={(e) => {
								e.stopPropagation();
								e.preventDefault();
								onDelete(connection.id);
								return false;
							}}
						/>
					</g>
				)}

				{/* Data Display Label (if connection has data payload) */}
				{connection.data && (
					<g>
						<rect
							x={midX - 40}
							y={midY - 15}
							width={80}
							height={30}
							rx={6}
							ry={6}
							fill="white"
							stroke={isSelected ? '#3b82f6' : connection.color || 'black'}
							strokeWidth={1}
							onClick={(e) => onSelect(connection.id, e)}
						/>
						<text
							x={midX}
							y={midY + 5}
							textAnchor="middle"
							fontSize={12}
							fill={isSelected ? '#3b82f6' : connection.color || 'black'}
							onClick={(e) => onSelect(connection.id, e)}
							style={{ pointerEvents: 'none' }}
						>
							{typeof connection.data === 'object'
								? JSON.stringify(connection.data).substring(0, 15) +
									(JSON.stringify(connection.data).length > 15 ? '...' : '')
								: String(connection.data).substring(0, 15) + (String(connection.data).length > 15 ? '...' : '')}
						</text>
					</g>
				)}
			</BaseConnection>
		</>
	);
};

/**
 * TempConnection Component
 *
 * Renders a temporary standard connection being created.
 */
export const TempConnection = ({
	isCreating = false,
	startElement,
	mousePosition,
	color = 'black',
	thickness = 2,
	dashArray = '5,5',
}) => {
	if (!isCreating || !mousePosition) return null;

	// Get current mouse position
	const mouseX = mousePosition.x;
	const mouseY = mousePosition.y;

	// If no element is selected yet, just show a line from cursor position
	if (!startElement) {
		return (
			<BaseConnection
				startX={mousePosition.x}
				startY={mousePosition.y}
				endX={mouseX}
				endY={mouseY}
				color={color}
				thickness={thickness}
				dashArray={dashArray}
			/>
		);
	}

	// Calculate connection points from start element to mouse
	const points = calculateTempConnectionPoints(startElement, mouseX, mouseY);
	if (!points) return null;

	const { startX, startY, endX, endY } = points;

	return (
		<BaseConnection
			startX={startX}
			startY={startY}
			endX={endX}
			endY={endY}
			color={color}
			thickness={thickness}
			dashArray={dashArray}
		/>
	);
};

/**
 * TempArrow Component
 *
 * Renders a temporary arrow connection being created.
 */
export const TempArrow = ({
	isCreating = false,
	startElement,
	mousePosition,
	color = 'black',
	thickness = 2,
	dashArray = '5,5',
}) => {
	if (!isCreating || !mousePosition) return null;

	// Get current mouse position
	const mouseX = mousePosition.x;
	const mouseY = mousePosition.y;

	// If no element is selected yet, just show a line from cursor position
	if (!startElement) {
		const angle = Math.atan2(mouseY - mousePosition.y, mouseX - mousePosition.x);
		const arrowHead = calculateArrowHead(mouseX, mouseY, angle, 14);

		return (
			<BaseConnection
				startX={mousePosition.x}
				startY={mousePosition.y}
				endX={mouseX}
				endY={mouseY}
				color={color}
				thickness={thickness}
				dashArray={dashArray}
				showEndMarker={false}
			>
				<polygon
					points={`${mouseX},${mouseY} ${arrowHead.x1},${arrowHead.y1} ${arrowHead.x2},${arrowHead.y2}`}
					fill={color}
				/>
			</BaseConnection>
		);
	}

	// Calculate connection points from start element to mouse
	const points = calculateTempConnectionPoints(startElement, mouseX, mouseY);
	if (!points) return null;

	const { startX, startY, endX, endY, angle } = points;
	const arrowHead = calculateArrowHead(endX, endY, angle, 14);

	return (
		<BaseConnection
			startX={startX}
			startY={startY}
			endX={endX}
			endY={endY}
			color={color}
			thickness={thickness}
			dashArray={dashArray}
			showEndMarker={false}
		>
			<polygon
				points={`${endX},${endY} ${arrowHead.x1},${arrowHead.y1} ${arrowHead.x2},${arrowHead.y2}`}
				fill={color}
			/>
		</BaseConnection>
	);
};
