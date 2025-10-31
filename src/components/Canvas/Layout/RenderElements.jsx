/**
 * RenderElements Component Module
 *
 * This module sits at the third level of the canvas architecture hierarchy and is responsible
 * for rendering all individual elements (nodes, images, etc.) within the canvas.
 *
 * Architecture Flow:
 * 1. Canvas (top-level page component) - Contains multiple canvas instances
 * 2. RenderCanvas - Implements a single canvas instance with its context
 * 3. RenderElements (this component) - Renders and manages all individual elements
 * 4. RenderElement (individual component) - Renders a single element with its interactions
 *
 * The RenderElements component serves as a container that maps over all elements from the canvas
 * context and renders individual RenderElement components with appropriate props and callbacks.
 */

import React from 'react';
import { useCanvas } from '../Utils/CanvasContext';
import CanvasElement from '../Components/CanvasElement';

/**
 * RenderElements Component
 *
 * This component:
 * - Retrieves the list of all elements and related state from the canvas context
 * - Maps over each element and renders an individual CanvasElement component
 * - Passes down selection state, connection state, and all necessary event handlers
 *
 * This component doesn't maintain its own state - it's a pure consumer of the
 * canvas context that passes data and callbacks down to individual elements.
 *
 * @returns {JSX.Element|null} Collection of all canvas elements or null if no elements exist
 */
const RenderElements = () => {
	// Extract all required state and callbacks from the canvas context
	const {
		// State
		elements, // Array of all canvas elements
		selectedId, // ID of the currently selected element
		isConnecting, // Boolean flag indicating if a connection is being created
		isCreatingArrow, // Boolean flag indicating if an arrow is being created
		connections, // Array of all connections between elements
		arrows, // Array of all arrows between elements

		// Event handlers
		handleSelect, // Function to handle element selection
		updateElement, // Function to update element properties (position, etc.)
		updateElementSize, // Function to update element dimensions
		deleteElement, // Function to remove an element from canvas
		handleScaleStart, // Function to initiate element resizing
		handleStartConnection, // Function to start creating a connection from an element
		handleCompleteConnection, // Function to complete a connection to another element
		handleStartArrow, // Function to start creating an arrow from an element
		handleCompleteArrow, // Function to complete an arrow to another element
	} = useCanvas();

	// Early return if no elements exist
	if (!elements || elements.length === 0) return null;

	return (
		<>
			{elements.map((element) => (
				<CanvasElement
					key={element.id}
					element={element}
					isSelected={selectedId === element.id}
					isConnecting={isConnecting}
					isCreatingArrow={isCreatingArrow}
					connections={connections}
					arrows={arrows}
					onSelect={handleSelect}
					onUpdate={updateElement}
					onUpdateSize={updateElementSize}
					onDelete={deleteElement}
					onScaleStart={handleScaleStart}
					onStartConnection={handleStartConnection}
					onCompleteConnection={handleCompleteConnection}
					onStartArrow={handleStartArrow}
					onCompleteArrow={handleCompleteArrow}
				/>
			))}
		</>
	);
};

export default RenderElements;
