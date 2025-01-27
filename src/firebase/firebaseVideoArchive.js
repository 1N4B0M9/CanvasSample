import {
	updateDoc,
	onSnapshot,
	setDoc,
	collection,
	addDoc,
	getDocs,
	where,
	query,
	deleteDoc,
	doc,
	getDoc,
	serverTimestamp,
} from 'firebase/firestore';
import { useState, useEffect } from 'react';

import { db } from './firebase';

const videoCollectionName = 'youtube-videos';
const videoArchiveCollectionName = 'youtube-deleted-history';

export const deleteAndArchiveVideo = async (videoId) => {
	try {
		const videoDocRef = doc(db, videoCollectionName, videoId);
		const videoSnapshot = await getDoc(videoDocRef);

		if (!videoSnapshot.exists()) {
			throw new Error('Video not found');
		}

		const videoData = videoSnapshot.data();
		videoData.archivedAt = serverTimestamp();

		await deleteDoc(videoDocRef);

		await setDoc(doc(db, videoArchiveCollectionName, videoId), videoData);

		return true;
	} catch (error) {
		console.error('Error deleting video:', error);
		return false;
	}
};

export const restoreVideo = async (videoId) => {
	try {
		const videoDocRef = doc(db, videoArchiveCollectionName, videoId);
		const videoSnapshot = await getDoc(videoDocRef);

		if (!videoSnapshot.exists()) {
			throw new Error('Video not found');
		}

		const videoData = videoSnapshot.data();
		delete videoData.archivedAt;

		await deleteDoc(videoDocRef);

		await setDoc(doc(db, videoCollectionName, videoId), videoData);

		return true;
	} catch (error) {
		console.error('Error restoring video:', error);
		return false;
	}
};

export const fetchArchivedVideosFromFirebase = () => {
	const [videos, setVideos] = useState([]);

	useEffect(() => {
		const unsubscribe = onSnapshot(collection(db, videoArchiveCollectionName), (snapshot) => {
			const videoData = snapshot.docs.map((document) => ({
				...document.data(),
				key: document.id,
			}));
			setVideos(videoData);
		});

		return unsubscribe;
	}, []);

	return videos;
};

// Get unique topics
export const getArchivedTopics = async () => {
	try {
		const videosRef = collection(db, videoArchiveCollectionName);
		const querySnapshot = await getDocs(videosRef);

		const topicsSet = new Set();
		querySnapshot.forEach((document) => {
			const videoData = document.data();
			if (videoData.category) {
				topicsSet.add(videoData.category);
			}
		});

		return Array.from(topicsSet); // Convert Set to Array
	} catch (error) {
		console.error('Error fetching topics: ', error);
		return [];
	}
};

export const getArchivedSubtopics = async (category) => {
	try {
		const videosRef = collection(db, videoArchiveCollectionName);
		const queryConstraint = where('category', '==', category);
		const querySnapshot = await getDocs(query(videosRef, queryConstraint));

		const subtopicsSet = new Set();
		querySnapshot.forEach((document) => {
			const videoData = document.data();
			if (videoData.subtopic) {
				subtopicsSet.add(videoData.subtopic);
			}
		});

		return Array.from(subtopicsSet);
	} catch (error) {
		console.error('Error fetching subtopics: ', error);
		return [];
	}
};

export const fetchArchivedTopicsAndSubtopics = () => {
	const [subtopicGroups, setSubtopicGroups] = useState(null);

	useEffect(() => {
		const unsubscribe = onSnapshot(collection(db, videoArchiveCollectionName), async (snapshot) => {
			const topics = await getArchivedTopics();
			const allSubtopics = {};

			// Fetch subtopics for each topic in parallel
			const subtopicPromises = topics.map(async (category) => {
				const subtopics = await getArchivedSubtopics(category);
				allSubtopics[category] = subtopics;
			});

			// Wait for all subtopic fetches to complete
			await Promise.all(subtopicPromises);
			setSubtopicGroups(Object.entries(allSubtopics));
		});

		return unsubscribe;
	}, []);

	return subtopicGroups;
};
