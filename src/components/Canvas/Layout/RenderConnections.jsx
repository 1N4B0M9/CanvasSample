/**
 * RenderConnections Component Module
 *
 * This module sits at the third level of the canvas architecture hierarchy and is responsible
 * for rendering all connections (standard connections, arrows, and temporary connections)
 * within the canvas.
 *
 * Architecture Flow:
 * 1. Canvas (top-level page component) - Contains multiple canvas instances
 * 2. RenderCanvas - Implements a single canvas instance with its context
 * 3. RenderConnections (this component) - Manages and renders connection sub-components
 * 4. Connection Components (FullConnection, Arrow, TempConnection, TempArrow)
 */

import React from 'react';
import { useCanvas } from '../Utils/CanvasContext';
import { FullConnection, Arrow, TempConnection, TempArrow } from '../Components/Connections/ConnectionElement';

/**
 * RenderConnections Component
 *
 * This component:
 * - Retrieves all connection-related state and handlers from canvas context
 * - Renders specialized components for each connection type
 * - Serves as a manager for all the connection rendering
 *
 * @returns {JSX.Element} All connection-related elements in the canvas
 */
const RenderConnections = () => {
	const {
		// Elements (needed for connection coordinates)
		elements,

		// Standard connections
		connections,
		selectedConnectionId,
		handleConnectionSelect,
		deleteConnection,

		// Arrows
		arrows,
		selectedArrowId,
		handleArrowSelect,
		deleteArrow,

		// Temporary standard connection
		isConnecting,
		connectionStart,

		// Temporary arrow
		isCreatingArrow,
		arrowStart,

		// Shared
		mousePosition,
	} = useCanvas();

	return (
		<>
			{/* Standard Connections */}
			{connections.map((connection) => (
				<FullConnection
					key={connection.id}
					connection={connection}
					elements={elements}
					isSelected={selectedConnectionId === connection.id}
					onSelect={handleConnectionSelect}
					onDelete={deleteConnection}
				/>
			))}

			{/* Arrows */}
			{arrows.map((arrow) => (
				<Arrow
					key={arrow.id}
					connection={arrow}
					elements={elements}
					isSelected={selectedArrowId === arrow.id}
					onSelect={handleArrowSelect}
					onDelete={deleteArrow}
				/>
			))}

			{/* Temporary Connection */}
			<TempConnection
				isCreating={isConnecting}
				startElement={connectionStart?.element}
				mousePosition={mousePosition}
				color="black"
				thickness={2}
				dashArray="5,5"
			/>

			{/* Temporary Arrow */}
			<TempArrow
				isCreating={isCreatingArrow}
				startElement={arrowStart?.element}
				mousePosition={mousePosition}
				color="black"
				thickness={2}
				dashArray="5,5"
			/>
		</>
	);
};

export default RenderConnections;
