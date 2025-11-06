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
			setCurrentUser(
				user
					? {
							uid: user.uid ?? null,
							email: user.email ?? null,
							displayName: user.displayName ?? null,
							photoURL: user.photoURL ?? null,
						}
					: null,
			);
			setLoading(false);
		});
		return unsubscribe;
	}, []);

	const value = {
		currentUser,
		loading,
	};

	return <AuthContext.Provider value={value}>{!loading && children}</AuthContext.Provider>;
}
