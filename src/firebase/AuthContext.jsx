import { createContext, useContext, useState, useEffect } from 'react';
import { auth } from './firebase';

const AuthContext = createContext();

export function useAuth() {
	return useContext(AuthContext);
}

export function AuthProvider({ children }) {
	const [currentUser, setCurrentUser] = useState();
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		const unsubscribe = auth.onAuthStateChanged((user) => {
			// passing through only safe user data
			const currUserData = {
				uid: user.uid,
				email: user.email,
				displayName: user.displayName,
				photoURL: user.photoURL,
			};
			setCurrentUser(currUserData);
			setLoading(false);
		});
		return unsubscribe;
	}, []);

	const value = {
		currentUser,
	};

	return <AuthContext.Provider value={value}>{!loading && children}</AuthContext.Provider>;
}
