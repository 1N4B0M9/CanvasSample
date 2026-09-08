import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../firebase/AuthContext';
import ResourceManagerMain from '../Layouts/Main/ResourceManager';

function ResourceManager() {
	const { currentUser } = useAuth();
	const navigate = useNavigate();

	useEffect(() => {
		if (currentUser && currentUser.uid === process.env.REACT_APP_ADMIN_UID) {
			navigate('/resourceManager');
		} else {
			navigate('/');
		}
	}, [currentUser, navigate]);

	return (
		<div>
			<ResourceManagerMain />
		</div>
	);
}

export default ResourceManager;
