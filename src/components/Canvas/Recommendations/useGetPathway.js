import { useState, useCallback, useRef } from 'react';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../../../firebase/firebase';

/**
 * Wraps the getPathway Firebase callable function.
 * Caches results in-memory for the session — same goalType = no refetch.
 */
export default function useGetPathway() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const cache = useRef({});

  const fetchPathway = useCallback(async ({ goalType, domain }) => {
    if (!goalType) return null;

    if (cache.current[goalType]) {
      setData(cache.current[goalType]);
      return cache.current[goalType];
    }

    setLoading(true);
    setError(null);

    try {
      const getPathway = httpsCallable(functions, 'getPathway');
      const result = await getPathway({
        goalType,
        domain,
        location: 'Pittsburgh PA',
        year: new Date().getFullYear(),
      });

      cache.current[goalType] = result.data;
      setData(result.data);
      return result.data;
    } catch (err) {
      setError(err.message || 'Failed to load resources');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return { fetchPathway, data, loading, error };
}
