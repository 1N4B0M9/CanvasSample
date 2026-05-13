// functions/index.js
const functions = require('firebase-functions/v1');
const admin = require('firebase-admin');

admin.initializeApp();
const db = admin.firestore();

// enum validation

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

// firestore resource query

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

// track a: enrich existing resources with current status blurbs

async function callSonarEnrichment(resources, goalType) {
  try {
    const apiKey = process.env.PERPLEXITY_API_KEY;
    if (!apiKey) return {};

    const orgNames = resources.map((r) => r.name).join('\n');
    const year = new Date().getFullYear();

    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'sonar',
        messages: [
          {
            role: 'system',
            content:
              'You are a social services information assistant for Pittsburgh PA. Return only valid JSON, no markdown.',
          },
          {
            role: 'user',
            content: `For each organization below, provide a 1-2 sentence current status update about their programs and availability for Pittsburgh PA residents in ${year}.\n\nReturn ONLY valid JSON: {"Org Name": "status blurb"}\n\nOrganizations (for ${goalType.replace(/_/g, ' ')} services):\n${orgNames}`,
          },
        ],
        max_tokens: 400,
      }),
    });

    if (!response.ok) return {};
    const data = await response.json();
    const raw = data.choices[0].message.content.trim();
    return JSON.parse(raw);
  } catch (err) {
    functions.logger.warn('Sonar enrichment failed', { err: err.message });
    return {};
  }
}

// track b: discover additional orgs not already in firestore

async function callSonarDiscovery(goalType, existingNames) {
  try {
    const apiKey = process.env.PERPLEXITY_API_KEY;
    if (!apiKey) return [];

    const year = new Date().getFullYear();
    const knownList = existingNames.join(', ');

    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'sonar',
        messages: [
          {
            role: 'system',
            content:
              'You are a social services information assistant for Pittsburgh PA. Return only valid JSON arrays, no markdown.',
          },
          {
            role: 'user',
            content: `These Pittsburgh PA organizations already serve re-entry women for ${goalType.replace(/_/g, ' ')} in ${year}:\n${knownList}\n\nFind 3 DIFFERENT currently operating Pittsburgh PA / Allegheny County organizations NOT on this list that serve a similar purpose.\n\nReturn ONLY a valid JSON array:\n[\n  {\n    "name": "org name",\n    "description": "1-2 sentences",\n    "contactPhone": "412-xxx-xxxx or null",\n    "contactUrl": "website.com or null",\n    "pathwaySteps": [\n      {"order": 1, "title": "...", "detail": "...", "actionLabel": "Do first", "url": null},\n      {"order": 2, "title": "...", "detail": "...", "actionLabel": "Then", "url": null},\n      {"order": 3, "title": "...", "detail": "...", "actionLabel": "Finally", "url": null}\n    ]\n  }\n]`,
          },
        ],
        max_tokens: 800,
      }),
    });

    if (!response.ok) return [];
    const data = await response.json();
    const raw = data.choices[0].message.content.trim();
    const parsed = JSON.parse(raw);
    return parsed.slice(0, 3).map((org, i) => ({
      ...org,
      id: `sonar-${goalType}-${i}`,
      source: 'sonar',
      active: true,
      contact: { phone: org.contactPhone ?? '', url: org.contactUrl ?? '' },
    }));
  } catch (err) {
    functions.logger.warn('Sonar discovery failed', { err: err.message });
    return [];
  }
}

// cache helpers

const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

async function getCached(key) {
  try {
    const doc = await db.collection('pathway_cache').doc(key).get();
    if (!doc.exists) return null;
    const data = doc.data();
    if (Date.now() - data.cachedAt.toMillis() > CACHE_TTL_MS) return null;
    return data.value;
  } catch {
    return null;
  }
}

async function writeCache(key, value) {
  try {
    await db.collection('pathway_cache').doc(key).set({
      value,
      cachedAt: admin.firestore.Timestamp.now(),
    });
  } catch (err) {
    functions.logger.warn('Cache write failed', { key, err: err.message });
  }
}

// main callable function

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

  let resources;
  try {
    resources = await fetchResources(goalType);
  } catch (err) {
    functions.logger.error('Firestore resource fetch failed', { err: err.message });
    throw new functions.https.HttpsError('internal', 'Failed to fetch resources');
  }

  const enrichmentKey = `${goalType}_enrichment`;
  const discoveryKey = `${goalType}_discovery`;

  let [enrichments, sonarResources] = await Promise.all([
    getCached(enrichmentKey),
    getCached(discoveryKey),
  ]);

  if (!enrichments || !sonarResources) {
    const [freshEnrichments, freshDiscovery] = await Promise.all([
      enrichments ? Promise.resolve(enrichments) : callSonarEnrichment(resources, goalType),
      sonarResources ? Promise.resolve(sonarResources) : callSonarDiscovery(goalType, resources.map((r) => r.name)),
    ]);

    if (!enrichments && freshEnrichments) {
      enrichments = freshEnrichments;
      await writeCache(enrichmentKey, enrichments);
    }
    if (!sonarResources && freshDiscovery) {
      sonarResources = freshDiscovery;
      await writeCache(discoveryKey, sonarResources);
    }
  }

  const enrichedResources = resources.map((r) => ({
    ...r,
    sonarEnrichment: enrichments?.[r.name] ?? null,
  }));

  return {
    resources: enrichedResources,
    sonarResources: sonarResources ?? [],
    queriedAt: Date.now(),
  };
});
