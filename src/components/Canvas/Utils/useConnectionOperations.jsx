import { useCallback, useRef, useEffect } from 'react';
import ConnectionManager from './ConnectionManager';

const useConnectionOperations = (
	elements,
	connections,
	setConnections,
	selectedConnectionId,
	setSelectedConnectionId,
) => {
	// Reference to ConnectionManager instance
	const connectionManagerRef = useRef(new ConnectionManager(elements));

	// Update connection manager when elements change
	useEffect(() => {
		connectionManagerRef.current = new ConnectionManager(elements);
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
		(connection) => connectionManagerRef.current.getConnectionCoordinates(connection),
		[],
	);

	// Get temporary connection coordinates when drawing
	const getTempConnectionCoordinates = useCallback(
		(element, mouseX, mouseY) => connectionManagerRef.current.getTempConnectionCoordinates(element, mouseX, mouseY),
		[],
	);

	return {
		createConnection,
		deleteConnection,
		getConnectionCoordinates,
		getTempConnectionCoordinates,
		connectionManager: connectionManagerRef.current,
	};
};

export default useConnectionOperations;
