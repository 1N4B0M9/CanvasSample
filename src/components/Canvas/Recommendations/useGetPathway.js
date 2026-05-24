import { useState, useCallback, useRef } from 'react';
import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '../../../firebase/firebase';

const WORKER_URL = process.env.REACT_APP_PATHWAY_WORKER_URL;

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

    if (!WORKER_URL) {
      setError('REACT_APP_PATHWAY_WORKER_URL is not configured');
      setLoading(false);
      return null;
    }

    // domain was forwarded to the old Cloud Function but is not used by the Cloudflare Worker

    try {
      // Query Firestore client-side — authenticated users can read `resources`
      const q = query(
        collection(db, 'resources'),
        where('active', '==', true),
        where('goalTypes', 'array-contains', goalType),
        orderBy('lastVerified', 'desc'),
        limit(5),
      );
      const snapshot = await getDocs(q);
      const resources = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));

      const response = await fetch(WORKER_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ goalType, resources }),
        signal: AbortSignal.timeout(15_000),
      });

      if (!response.ok) throw new Error(`Worker error: ${response.status}`);
      const { enrichments, sonarResources } = await response.json();

      const enrichedResources = resources.map((r) => ({
        ...r,
        sonarEnrichment: enrichments?.[r.name] ?? null,
      }));

      const result = {
        resources: enrichedResources,
        sonarResources: sonarResources ?? [],
        queriedAt: Date.now(),
      };

      cache.current[goalType] = result;
      setData(result);
      return result;
    } catch (err) {
      setError(err.message || 'Failed to load resources');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return { fetchPathway, data, loading, error };
}
