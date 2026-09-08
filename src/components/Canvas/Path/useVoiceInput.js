import { useState, useRef, useCallback, useEffect } from 'react';

/**
 * Web Speech API wrapper. Graceful no-op where unsupported (supported: false).
 */
export default function useVoiceInput(onResult) {
	const [listening, setListening] = useState(false);
	const recognitionRef = useRef(null);
	const onResultRef = useRef(onResult);
	onResultRef.current = onResult;

	const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
	const supported = Boolean(SpeechRecognition);

	const stop = useCallback(() => {
		if (recognitionRef.current) {
			recognitionRef.current.stop();
			recognitionRef.current = null;
		}
		setListening(false);
	}, []);

	const start = useCallback(() => {
		if (!supported || recognitionRef.current) return;

		const recognition = new SpeechRecognition();
		recognition.lang = 'en-US';
		recognition.interimResults = false;
		recognition.maxAlternatives = 1;

		recognition.onresult = (event) => {
			const transcript = Array.from(event.results)
				.map((r) => r[0]?.transcript ?? '')
				.join(' ')
				.trim();
			if (transcript && onResultRef.current) onResultRef.current(transcript);
		};
		recognition.onend = () => {
			recognitionRef.current = null;
			setListening(false);
		};
		recognition.onerror = () => {
			recognitionRef.current = null;
			setListening(false);
		};

		recognitionRef.current = recognition;
		setListening(true);
		recognition.start();
	}, [supported, SpeechRecognition]);

	useEffect(() => stop, [stop]);

	return { supported, listening, start, stop };
}
