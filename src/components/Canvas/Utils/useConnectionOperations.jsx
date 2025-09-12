import { useCallback, useRef, useEffect } from 'react';

const useConnectionOperations = (
	elements,
	connections,
	setConnections,
	selectedConnectionId,
	setSelectedConnectionId,
) => {
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

	return {
		createConnection,
		deleteConnection,
	};
};

export default useConnectionOperations;
