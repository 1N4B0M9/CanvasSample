import TAG_MAP from './resourceTagMap';

/**
 * Score a text string against the keyword tag dictionary.
 * Returns the { goalType, domain } with the highest match count, or null if no tags match.
 * Runs client-side only — no network call. Never called with raw API payloads.
 *
 * @param {string} text
 * @returns {{ goalType: string, domain: string, score: number } | null}
 */
export function detectGoal(text) {
  if (!text || typeof text !== 'string') return null;

  const lower = text.toLowerCase();
  const scores = {};

  for (const [keyword, mapping] of Object.entries(TAG_MAP)) {
    if (lower.includes(keyword)) {
      const key = mapping.goalType;
      if (!scores[key]) {
        scores[key] = { ...mapping, score: 0 };
      }
      scores[key].score += 1;
    }
  }

  const entries = Object.values(scores);
  if (entries.length === 0) return null;

  return entries.reduce((best, curr) => (curr.score > best.score ? curr : best));
}
