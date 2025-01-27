import ios from './img/ios.png';
import android from './img/android.png';
import set from './img/set.png';
import user from './img/user.png';
import x2 from './img/x2.png';
import amazonPhishing from './img/amazonPhishing.png';

import test from './img/test.mp4';
// Mobile imports
import swipingPhone from './img/Mobile/swipingPhone.jpg';
import dialingNumber from './img/Mobile/dialingNumber.jpg';
import turningOffPhone from './img/Mobile/turningOffPhone.png';
import iosAppstore from './img/Mobile/iosAppstore.png';
import adrAppstore from './img/Mobile/adrAppstore.png';
import iosAlbum from './img/Mobile/iosAlbum.png';
import adrAlbum from './img/Mobile/adrAlbum.png';
import iosSettings from './img/Mobile/iosSettings.png';
import adrSettings from './img/Mobile/adrSettings.png';
import iosCamera from './img/Mobile/iosCamera.png';
import adrCamera from './img/Mobile/adrCamera.png';
import iMessage from './img/Mobile/iMessage.png';

const questions = {
	desktop: {
		easy: [
			{
				id: 1,
				text: '1 Can you identify the App Store on your desktop?',
				videos: [test, test],
				images: [ios, android],
				answerText: 'this is answer',
				options: [
					{
						label: 'Option A',
						image: [x2, android],
						isCorrect: false,
					},
					{
						label: 'Option B',
						image: [iosAlbum, android],
						isCorrect: false,
					},
					{
						label: 'Option C',
						image: [iosSettings, android],
						isCorrect: true,
					},
				],
			},
			{
				id: 2,
				text: '2 Can you identify the Album in your phone?',
				videos: [test, test],
				options: [
					{
						label: 'Option A',
						image: [ios, android],
						isCorrect: false,
					},
					{
						label: 'Option B',
						image: [iosSettings, android],
						isCorrect: false,
					},
					{
						label: 'Option C',
						image: [iosAlbum, android],
						isCorrect: true,
					},
				],
			},
			{
				id: 3,
				text: '3 Can you identify the App Store on your desktop?',
				videos: [test, test],
				options: [
					{
						label: 'Option A',
						image: [ios, android],
						isCorrect: false,
					},
					{
						label: 'Option B',
						image: [set, user],
						isCorrect: false,
					},
					{
						label: 'Option C',
						image: [amazonPhishing, user],
						isCorrect: true,
					},
				],
			},
			{
				id: 4,
				text: '4 Can you identify the App Store on your desktop?',
				videos: [test, test],
				options: [
					{
						label: 'Option A',
						image: [ios, android],
						isCorrect: false,
					},
					{
						label: 'Option B',
						image: [set, user],
						isCorrect: false,
					},
					{
						label: 'Option C',
						image: [ios, user],
						isCorrect: true,
					},
				],
			},
			{
				id: 5,
				text: '5 Can you identify the App Store on your desktop?',
				videos: [test, test],
				options: [
					{
						label: 'Option A',
						image: [ios, android],
						isCorrect: false,
					},
					{
						label: 'Option B',
						image: [set, user],
						isCorrect: false,
					},
					{
						label: 'Option C',
						image: [ios, user],
						isCorrect: true,
					},
				],
			},
		],
		moderate: [
			{
				id: 21,
				text: '11 Moderate desktop question example?',
				videos: [test, test],
				options: [
					{
						label: 'Option A',
						image: [ios, android],
						isCorrect: true,
					},
					{
						label: 'Option B',
						image: [set, user],
						isCorrect: false,
					},
					{
						label: 'Option C',
						image: [ios, user],
						isCorrect: false,
					},
				],
			},
			{
				id: 22,
				text: '12 Moderate desktop question example?',
				videos: [test, test],
				options: [
					{
						label: 'Option A',
						image: [ios, android],
						isCorrect: true,
					},
					{
						label: 'Option B',
						image: [set, user],
						isCorrect: false,
					},
					{
						label: 'Option C',
						image: [ios, user],
						isCorrect: false,
					},
				],
			},
			{
				id: 23,
				text: '13 Moderate desktop question example?',
				videos: [test, test],
				options: [
					{
						label: 'Option A',
						image: [ios, android],
						isCorrect: true,
					},
					{
						label: 'Option B',
						image: [set, user],
						isCorrect: false,
					},
					{
						label: 'Option C',
						image: [ios, user],
						isCorrect: false,
					},
				],
			},
			{
				id: 24,
				text: '14 Moderate desktop question example?',
				videos: [test, test],
				options: [
					{
						label: 'Option A',
						image: [ios, android],
						isCorrect: true,
					},
					{
						label: 'Option B',
						image: [set, user],
						isCorrect: false,
					},
					{
						label: 'Option C',
						image: [ios, user],
						isCorrect: false,
					},
				],
			},
			{
				id: 25,
				text: '15 Moderate desktop question example?',
				videos: [test, test],
				options: [
					{
						label: 'Option A',
						image: [ios, android],
						isCorrect: true,
					},
					{
						label: 'Option B',
						image: [set, user],
						isCorrect: false,
					},
					{
						label: 'Option C',
						image: [ios, user],
						isCorrect: false,
					},
				],
			},
			// Add more moderate desktop questions...
		],
		hard: [
			{
				id: 41,
				text: '21 Hard desktop question example?',
				videos: [test, test],
				options: [
					{
						label: 'Option A',
						image: [ios, android],
						isCorrect: false,
					},
					{
						label: 'Option B',
						image: [set, user],
						isCorrect: true,
					},
					{
						label: 'Option C',
						image: [ios, user],
						isCorrect: false,
					},
				],
			},
			{
				id: 42,
				text: '22 Hard desktop question example?',
				videos: [test, test],
				options: [
					{
						label: 'Option A',
						image: [ios, android],
						isCorrect: false,
					},
					{
						label: 'Option B',
						image: [set, user],
						isCorrect: true,
					},
					{
						label: 'Option C',
						image: [ios, user],
						isCorrect: false,
					},
				],
			},
			{
				id: 43,
				text: '23 Hard desktop question example?',
				videos: [test, test],
				options: [
					{
						label: 'Option A',
						image: [ios, android],
						isCorrect: false,
					},
					{
						label: 'Option B',
						image: [set, user],
						isCorrect: true,
					},
					{
						label: 'Option C',
						image: [ios, user],
						isCorrect: false,
					},
				],
			},
			{
				id: 44,
				text: '24 Hard desktop question example?',
				videos: [test, test],
				options: [
					{
						label: 'Option A',
						image: [ios, android],
						isCorrect: false,
					},
					{
						label: 'Option B',
						image: [set, user],
						isCorrect: true,
					},
					{
						label: 'Option C',
						image: [ios, user],
						isCorrect: false,
					},
				],
			},
			{
				id: 45,
				text: '25 Hard desktop question example?',
				videos: [test, test],
				options: [
					{
						label: 'Option A',
						image: [ios, android],
						isCorrect: false,
					},
					{
						label: 'Option B',
						image: [set, user],
						isCorrect: true,
					},
					{
						label: 'Option C',
						image: [ios, user],
						isCorrect: false,
					},
				],
			},
			// Add more hard desktop questions...
		],
	},
	mobile: {
		easy: [
			{
				id: 61,
				text: '61 Which of the following images shows how to unlock a smartphone? ',
				answerText: 'You can swipe your phone to unlock your smartphone:',
				images: [swipingPhone],
				videos: [],
				options: [
					{
						label: 'Swiping Phone',
						image: [swipingPhone],
						isCorrect: true,
					},
					{
						label: 'Dialing Number',
						image: [dialingNumber],
						isCorrect: false,
					},
					{
						label: 'Turning off phone',
						image: [turningOffPhone],
						isCorrect: false,
					},
				],
			},
			{
				id: 62,
				text: '62 Can you identify the app icon that you can use to install new application?',
				answerText: 'This is the application shop on either an iphone or an andriod phone:',
				images: [iosAppstore, adrAppstore],
				videos: [],
				options: [
					{
						label: 'Option A',
						image: [iosCamera, adrCamera],
						isCorrect: false,
					},
					{
						label: 'Option B',
						image: [iosSettings, adrSettings],
						isCorrect: false,
					},
					{
						label: 'Option C',
						image: [iosAppstore, adrAppstore],
						isCorrect: true,
					},
				],
			},
			{
				id: 63,
				text: '63 How do you send a text message?',
				answerText: '1. Opening the message app\n2. Select a contact\n3. typing a message\n4. Pressing Send',
				images: [iMessage],
				videos: [],
				options: [
					{
						label: 'Option A',
						image: [ios, android],
						isCorrect: false,
					},
					{
						label: 'Option B',
						image: [set, user],
						isCorrect: false,
					},
					{
						label: 'Option C',
						image: [amazonPhishing, user],
						isCorrect: true,
					},
				],
			},
			{
				id: 64,
				text: '4 Can you identify the App Store on your desktop?',
				videos: [test, test],
				options: [
					{
						label: 'Option A',
						image: [ios, android],
						isCorrect: false,
					},
					{
						label: 'Option B',
						image: [set, user],
						isCorrect: false,
					},
					{
						label: 'Option C',
						image: [ios, user],
						isCorrect: true,
					},
				],
			},
			{
				id: 65,
				text: '5 Can you identify the App Store on your desktop?',
				videos: [test, test],
				options: [
					{
						label: 'Option A',
						image: [ios, android],
						isCorrect: false,
					},
					{
						label: 'Option B',
						image: [set, user],
						isCorrect: false,
					},
					{
						label: 'Option C',
						image: [ios, user],
						isCorrect: true,
					},
				],
			},
		],
		moderate: [
			{
				id: 81,
				text: '81 Which of the following images shows how to unlock a smartphone? ',
				answerText: 'You can swipe your phone to unlock your smartphone:',
				images: [swipingPhone],
				videos: [],
				options: [
					{
						label: 'Swiping Phone',
						image: [swipingPhone],
						isCorrect: true,
					},
					{
						label: 'Dialing Number',
						image: [dialingNumber],
						isCorrect: false,
					},
					{
						label: 'Turning off phone',
						image: [turningOffPhone],
						isCorrect: false,
					},
				],
			},
			// Add more moderate mobile questions...
		],
		hard: [
			{
				id: 101,
				text: '101 Which of the following images shows how to unlock a smartphone? ',
				answerText: 'You can swipe your phone to unlock your smartphone:',
				images: [swipingPhone],
				videos: [],
				options: [
					{
						label: 'Swiping Phone',
						image: [swipingPhone],
						isCorrect: true,
					},
					{
						label: 'Dialing Number',
						image: [dialingNumber],
						isCorrect: false,
					},
					{
						label: 'Turning off phone',
						image: [turningOffPhone],
						isCorrect: false,
					},
				],
			},
			// Add more hard mobile questions...
		],
	},
};

export default questions;
