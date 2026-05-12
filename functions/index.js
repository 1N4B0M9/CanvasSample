// functions/index.js
const functions = require('firebase-functions');
const admin = require('firebase-admin');

admin.initializeApp();
const db = admin.firestore();

// ─── Enum validation ─────────────────────────────────────────────────────────

const VALID_GOAL_TYPES = new Set([
  'professional_license_reinstatement',
  'vocational_training',
  'employment_search',
  'sobriety_recovery',
  'mental_health_counseling',
  'housing_stability',
  'financial_literacy',
  'family_reunification',
  'childcare_support',
  'legal_aid',
  'education_ged_college',
  'peer_support',
]);

const VALID_DOMAINS = new Set([
  'financial_security',
  'social_belonging',
  'job_skills_education',
  'family_caregiving',
  'physical_health',
  'mental_health',
  'supporting_loved_ones',
  'community_support',
]);

// ─── Sonar query templates ────────────────────────────────────────────────────
// Server-side only — never derived from user-supplied text

const SONAR_QUERY_TEMPLATES = {
  professional_license_reinstatement:
    'Professional license reinstatement process requirements {location} {year} for people with criminal records',
  vocational_training:
    'Free vocational job training programs {location} {year} re-entry formerly incarcerated',
  employment_search:
    'Employment resources resume help job placement {location} {year} re-entry formerly incarcerated',
  sobriety_recovery:
    'Addiction recovery programs resources {location} {year} re-entry formerly incarcerated women',
  mental_health_counseling:
    'Mental health counseling services sliding scale {location} {year} re-entry formerly incarcerated',
  housing_stability:
    'Transitional housing programs {location} {year} formerly incarcerated women',
  financial_literacy:
    'Financial literacy credit repair banking programs {location} {year} low income',
  family_reunification:
    'Family reunification services formerly incarcerated parents {location} {year}',
  childcare_support:
    'Childcare assistance programs low income {location} {year}',
  legal_aid:
    'Free legal aid civil services formerly incarcerated {location} {year}',
  education_ged_college:
    'GED and college programs formerly incarcerated adults {location} {year}',
  peer_support:
    'Peer support groups formerly incarcerated women {location} {year}',
};

function buildSonarQuery(goalType) {
  const template = SONAR_QUERY_TEMPLATES[goalType];
  // Always use server-side values — client-supplied location/year are ignored
  return template
    .replace('{location}', 'Pittsburgh PA')
    .replace('{year}', String(new Date().getFullYear()));
}

// ─── Perplexity Sonar call ────────────────────────────────────────────────────

async function callSonar(goalType) {
  try {
    const apiKey = functions.config().perplexity?.api_key;
    if (!apiKey) {
      functions.logger.warn('Perplexity API key not configured — skipping Sonar call');
      return null;
    }

    const query = buildSonarQuery(goalType);

    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'sonar',
        messages: [
          {
            role: 'system',
            content:
              'You are a social services information assistant. Return factual, current information about community resources. Be brief — 1-2 sentences max. Include one specific actionable detail if available.',
          },
          { role: 'user', content: query },
        ],
        max_tokens: 150,
        return_citations: true,
      }),
    });

    if (!response.ok) {
      functions.logger.warn('Sonar API returned non-OK status', { status: response.status });
      return null;
    }

    const data = await response.json();
    return {
      summary: data.choices[0].message.content,
      asOf: new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
      source: data.citations?.[0] ?? '',
    };
  } catch (err) {
    functions.logger.warn('Sonar call failed — degrading gracefully', { err: err.message });
    return null;
  }
}

// ─── Firestore resource query ─────────────────────────────────────────────────

async function fetchResources(goalType) {
  const snapshot = await db
    .collection('resources')
    .where('active', '==', true)
    .where('goalTypes', 'array-contains', goalType)
    .orderBy('lastVerified', 'desc')
    .limit(5)
    .get();
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
}

// ─── Cache helpers ────────────────────────────────────────────────────────────

const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

async function getCachedSonar(goalType) {
  try {
    const doc = await db.collection('pathway_cache').doc(goalType).get();
    if (!doc.exists) return null;
    const data = doc.data();
    const age = Date.now() - data.cachedAt.toMillis();
    if (age > CACHE_TTL_MS) return null;
    return data.sonarUpdate;
  } catch {
    return null;
  }
}

async function writeSonarCache(goalType, sonarUpdate) {
  try {
    await db.collection('pathway_cache').doc(goalType).set({
      goalType,
      sonarUpdate,
      cachedAt: admin.firestore.Timestamp.now(),
    });
  } catch (err) {
    functions.logger.warn('Failed to write Sonar cache', { err: err.message });
  }
}

// ─── Main callable function ───────────────────────────────────────────────────

exports.getPathway = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Must be signed in to call getPathway');
  }

  const { goalType, domain } = data;

  if (!goalType || !VALID_GOAL_TYPES.has(goalType)) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      `Invalid goalType: "${goalType}". Must be one of: ${[...VALID_GOAL_TYPES].join(', ')}`
    );
  }
  if (!domain || !VALID_DOMAINS.has(domain)) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      `Invalid domain: "${domain}". Must be one of: ${[...VALID_DOMAINS].join(', ')}`
    );
  }

  // 1. Check Sonar cache first
  let sonarUpdate = await getCachedSonar(goalType);

  // 2. Fetch matching resources from Firestore
  let resources;
  try {
    resources = await fetchResources(goalType);
  } catch (err) {
    functions.logger.error('Firestore resource fetch failed', { err: err.message });
    throw new functions.https.HttpsError('internal', 'Failed to fetch resources');
  }

  // 3. Call Sonar only on cache miss
  if (!sonarUpdate) {
    sonarUpdate = await callSonar(goalType);
    if (sonarUpdate) {
      await writeSonarCache(goalType, sonarUpdate);
    }
  }

  return {
    resources,
    sonarUpdate,
    queriedAt: Date.now(),
  };
});
