import { useState, useCallback, useEffect, useRef } from 'react';

const SUBSTEPS_TIMEOUT_MS = 90_000;
const SUBSTEPS_TIMEOUT_MESSAGE = 'This is taking longer than usual. Please try again.';

export default function useSubSteps() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const requestIdRef = useRef(0);
  const mountedRef = useRef(false);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const fetchSubSteps = useCallback(async ({ goalText, stepText, userQuery }) => {
    const workerUrl = process.env.REACT_APP_PATHWAY_WORKER_URL;
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;
    setLoading(true);
    setError(null);

    if (!workerUrl) {
      setError('REACT_APP_PATHWAY_WORKER_URL is not configured');
      setLoading(false);
      return null;
    }

    const controller = new AbortController();
    let timedOut = false;
    const timeoutId = setTimeout(() => {
      timedOut = true;
      controller.abort();
    }, SUBSTEPS_TIMEOUT_MS);

    try {
      const response = await fetch(`${workerUrl}/substeps`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ goalText, stepText, userQuery }),
        signal: controller.signal,
      });
      if (!response.ok) throw new Error(`Worker error: ${response.status}`);
      return await response.json();
    } catch (err) {
      if (mountedRef.current && requestId === requestIdRef.current) {
        const message = timedOut || err?.name === 'AbortError' ? SUBSTEPS_TIMEOUT_MESSAGE : err.message || 'Failed to load sub-steps';
        setError(message);
      }
      return null;
    } finally {
      clearTimeout(timeoutId);
      if (mountedRef.current && requestId === requestIdRef.current) setLoading(false);
    }
  }, []);

  return { fetchSubSteps, loading, error };
}
