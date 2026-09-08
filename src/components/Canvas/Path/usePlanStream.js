import { useState, useRef, useCallback } from 'react';

const WORKER_URL = process.env.REACT_APP_PATHWAY_WORKER_URL;

const FRIENDLY_ERROR = 'Something went wrong on our end. Try again in a minute.';

/**
 * SSE hook for the /plan pipeline.
 * Phases: idle → thinking → clarify? → planning → done | crisis | error
 * The intake round-trip is two POSTs: the first may end at `clarify`; answer()/skip()
 * re-POST with the same query plus answers or skipIntake.
 */
export default function usePlanStream() {
	const [phase, setPhase] = useState('idle');
	const [intent, setIntent] = useState(null);
	const [questions, setQuestions] = useState([]);
	const [steps, setSteps] = useState([]);
	const [resourcesByStep, setResourcesByStep] = useState({});
	const [hotlines, setHotlines] = useState([]);
	const [planMeta, setPlanMeta] = useState(null);
	const [error, setError] = useState(null);

	const queryRef = useRef('');
	const boardContextRef = useRef(null);
	const correctionsRef = useRef([]);
	const abortRef = useRef(null);

	const reset = useCallback(() => {
		if (abortRef.current) abortRef.current.abort();
		setPhase('idle');
		setIntent(null);
		setQuestions([]);
		setSteps([]);
		setResourcesByStep({});
		setHotlines([]);
		setPlanMeta(null);
		setError(null);
		queryRef.current = '';
		boardContextRef.current = null;
		correctionsRef.current = [];
	}, []);

	const handleEvent = useCallback((event, data) => {
		switch (event) {
			case 'intent':
				setIntent(data);
				setPhase('planning');
				break;
			case 'clarify':
				setQuestions(data.questions ?? []);
				setPhase('clarify');
				break;
			case 'crisis':
				setHotlines(data.hotlines ?? []);
				setPhase('crisis');
				break;
			case 'step':
				setSteps((prev) =>
					prev.some((s) => s.id === data.id) ? prev : [...prev, data].sort((a, b) => a.order - b.order),
				);
				break;
			case 'resources':
				setResourcesByStep((prev) => ({ ...prev, [data.stepId]: data.items ?? [] }));
				break;
			case 'done':
				setPlanMeta(data);
				setPhase('done');
				break;
			case 'error':
				setError(data.message ?? FRIENDLY_ERROR);
				setPhase('error');
				break;
			default:
				break;
		}
	}, []);

	const stream = useCallback(
		async (body) => {
			if (!WORKER_URL) {
				setError(FRIENDLY_ERROR);
				setPhase('error');
				return;
			}

			if (abortRef.current) abortRef.current.abort();
			const controller = new AbortController();
			abortRef.current = controller;

			setPhase('thinking');
			setError(null);

			try {
				const response = await fetch(`${WORKER_URL.replace(/\/$/, '')}/plan`, {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify(body),
					signal: controller.signal,
				});

				if (!response.ok) {
					const payload = await response.json().catch(() => null);
					setError(payload?.message ?? FRIENDLY_ERROR);
					setPhase('error');
					return;
				}

				const reader = response.body.getReader();
				const decoder = new TextDecoder();
				let buffer = '';
				let sawTerminal = false;

				const processRawEvent = (raw) => {
					let eventName = 'message';
					let dataLine = '';
					raw.split('\n').forEach((line) => {
						if (line.startsWith('event: ')) eventName = line.slice(7).trim();
						if (line.startsWith('data: ')) dataLine += line.slice(6);
					});
					if (!dataLine) return;
					let data;
					try {
						data = JSON.parse(dataLine);
					} catch {
						return;
					}
					if (['clarify', 'crisis', 'done', 'error'].includes(eventName)) sawTerminal = true;
					handleEvent(eventName, data);
				};

				// eslint-disable-next-line no-constant-condition
				while (true) {
					// eslint-disable-next-line no-await-in-loop
					const { done, value } = await reader.read();
					if (done) break;
					buffer += decoder.decode(value, { stream: true });

					const events = buffer.split('\n\n');
					buffer = events.pop();
					events.forEach(processRawEvent);
				}

				if (!sawTerminal) {
					setError(FRIENDLY_ERROR);
					setPhase('error');
				}
			} catch (err) {
				if (err.name === 'AbortError') return;
				setError(FRIENDLY_ERROR);
				setPhase('error');
			}
		},
		[handleEvent],
	);

	/** First call: just the query (+ optional board context). */
	const ask = useCallback(
		(query, boardContext = null) => {
			queryRef.current = query;
			boardContextRef.current = boardContext;
			correctionsRef.current = [];
			setSteps([]);
			setResourcesByStep({});
			setPlanMeta(null);
			stream({ query, boardContext: boardContext ?? undefined });
		},
		[stream],
	);

	/** Second call: same query plus the intake answers. */
	const submitAnswers = useCallback(
		(answers) => {
			setSteps([]);
			setResourcesByStep({});
			stream({ query: queryRef.current, boardContext: boardContextRef.current ?? undefined, answers });
		},
		[stream],
	);

	/** "Skip — just build my path": second call with skipIntake. */
	const skipIntake = useCallback(() => {
		setSteps([]);
		setResourcesByStep({});
		stream({ query: queryRef.current, boardContext: boardContextRef.current ?? undefined, skipIntake: true });
	}, [stream]);

	/** Tapped-assumption correction — regenerates with the correction folded in. */
	const sendCorrection = useCallback(
		(correctionText) => {
			correctionsRef.current = [...correctionsRef.current, correctionText];
			setSteps([]);
			setResourcesByStep({});
			stream({
				query: queryRef.current,
				boardContext: boardContextRef.current ?? undefined,
				skipIntake: true,
				corrections: correctionsRef.current,
			});
		},
		[stream],
	);

	return {
		phase,
		intent,
		questions,
		steps,
		resourcesByStep,
		hotlines,
		planMeta,
		error,
		ask,
		submitAnswers,
		skipIntake,
		sendCorrection,
		reset,
	};
}
