import { initializeApp } from 'firebase/app';
import {
	signInWithEmailAndPassword,
	createUserWithEmailAndPassword,
	getAuth,
	sendPasswordResetEmail,
	signOut,
} from 'firebase/auth';
import { getFirestore, doc, Timestamp } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { addData } from './firebaseReadWrite';

// --- Firebase config (from your .env) ---
const firebaseConfig = {
	apiKey: process.env.REACT_APP_API_KEY,
	authDomain: process.env.REACT_APP_AUTH_DOMAIN,
	projectId: process.env.REACT_APP_PROJECT_ID,
	storageBucket: process.env.REACT_APP_STORAGE_BUCKET,
	messagingSenderId: process.env.REACT_APP_MESSAGE_SENDER_ID,
	appId: process.env.REACT_APP_APP_ID,
	measurementId: process.env.REACT_APP_MEASUREMENT_ID,
};

// --- Initialize core services ---
export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// --- Auth helper functions ---
const registerWithEmailAndPassword = async (name, email, password) => {
	try {
		const res = await createUserWithEmailAndPassword(auth, email, password);
		const { user } = res;
		const docRef = doc(db, 'users', user.uid);
		const docData = {
			date_created: Timestamp.fromDate(new Date()),
			uid: user.uid,
			name,
			email,
		};
		await addData(docRef, docData);
	} catch (err) {
		alert(err.message);
	}
};

const logInWithEmailAndPassword = async (email, password) => {
	try {
		await signInWithEmailAndPassword(auth, email, password);
	} catch (err) {
		alert(err.message);
	}
};

const sendPasswordReset = async (email) => {
	try {
		await sendPasswordResetEmail(auth, email);
		alert('Password reset link sent!');
	} catch (err) {
		alert(err.message);
	}
};

const logout = () => signOut(auth);

// --- Exports ---
export { registerWithEmailAndPassword, logInWithEmailAndPassword, logout, sendPasswordReset };
