import { useState, useCallback } from 'react';

export default function useSubSteps() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchSubSteps = useCallback(async ({ goalText, stepText, userQuery }) => {
    const workerUrl = process.env.REACT_APP_PATHWAY_WORKER_URL;
    setLoading(true);
    setError(null);

    if (!workerUrl) {
      setError('REACT_APP_PATHWAY_WORKER_URL is not configured');
      setLoading(false);
      return null;
    }

    const controller = new AbortController();
    // AbortSignal.timeout() not supported in Safari < 17.4 — use controller + setTimeout
    const timeoutId = setTimeout(() => controller.abort(), 15_000);

    try {
      let response;
      try {
        response = await fetch(`${workerUrl}/substeps`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ goalText, stepText, userQuery }),
          signal: controller.signal,
        });
      } finally {
        clearTimeout(timeoutId);
      }

      if (!response.ok) throw new Error(`Worker error: ${response.status}`);
      return await response.json();
    } catch (err) {
      setError(err.message || 'Failed to load sub-steps');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return { fetchSubSteps, loading, error };
}
