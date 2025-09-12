import { useCallback, useRef, useEffect } from 'react';
import ConnectionCalculator from './ConnectionCalculator';

const useConnectionOperations = (
	elements,
	connections,
	setConnections,
	selectedConnectionId,
	setSelectedConnectionId,
) => {
	// Reference to connectionOperationsRef instance
	const connectionCalculatorRef = useRef(new ConnectionCalculator(elements));

	// Update connection manager when elements change
	useEffect(() => {
		connectionCalculatorRef.current = new ConnectionCalculator(elements);
	}, [elements]);

	// Create a new connection between elements
	const createConnection = useCallback(
		(startId, endId) => {
			// Check if connection already exists
			const connectionExists = connections.some(
				(conn) =>
					(conn.startId === startId && conn.endId === endId) || (conn.startId === endId && conn.endId === startId),
			);

			if (!connectionExists) {
				const newConnection = {
					id: `conn-${Date.now()}`,
					startId,
					endId,
					type: 'line',
					color: 'black',
					thickness: 2,
				};

				setConnections((prev) => [...prev, newConnection]);
			}
		},
		[connections, setConnections],
	);

	// Delete a connection
	const deleteConnection = useCallback(
		(connectionId) => {
			setConnections((prev) => prev.filter((conn) => conn.id !== connectionId));
			setSelectedConnectionId(null);
		},
		[setConnections, setSelectedConnectionId],
	);

	// Get connection coordinates
	const getConnectionCoordinates = useCallback(
		(connection) => connectionCalculatorRef.current.getConnectionCoordinates(connection),
		[],
	);

	// Get temporary connection coordinates when drawing
	const getTempConnectionCoordinates = useCallback(
		(element, mouseX, mouseY) => connectionCalculatorRef.current.getTempConnectionCoordinates(element, mouseX, mouseY),
		[],
	);

	return {
		createConnection,
		deleteConnection,
		getConnectionCoordinates,
		getTempConnectionCoordinates,
		connectionOperationsRef: connectionCalculatorRef.current,
	};
};

export default useConnectionOperations;
