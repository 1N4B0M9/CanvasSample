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

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

async function callSonarEnrichment(resources, goalType, apiKey) {
  if (resources.length === 0) return {};

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
          content: 'You are a social services information assistant for Pittsburgh PA. Return only valid JSON, no markdown.',
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
  const raw = data?.choices?.[0]?.message?.content?.trim();
  if (!raw) return {};
  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

async function callSonarDiscovery(goalType, existingNames, apiKey) {
  const year = new Date().getFullYear();
  const knownList = existingNames.length > 0 ? existingNames.join(', ') : 'none listed';

  const response = await fetch('https://api.perplexity.ai/chat/completions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'sonar',
      messages: [
        {
          role: 'system',
          content: 'You are a social services information assistant for Pittsburgh PA. Return only valid JSON arrays, no markdown.',
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
  const raw = data?.choices?.[0]?.message?.content?.trim();
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.slice(0, 3).map((org, i) => ({
      ...org,
      id: `sonar-${goalType}-${i}`,
      source: 'sonar',
      active: true,
      contact: { phone: org.contactPhone ?? '', url: org.contactUrl ?? '' },
    }));
  } catch {
    return [];
  }
}

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: CORS_HEADERS });
    }

    if (request.method !== 'POST') {
      return new Response('Method not allowed', { status: 405, headers: CORS_HEADERS });
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
        status: 400,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      });
    }

    const { goalType, resources } = body;

    if (!goalType || !VALID_GOAL_TYPES.has(goalType)) {
      return new Response(JSON.stringify({ error: `Invalid goalType: "${goalType}"` }), {
        status: 400,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      });
    }

    if (!Array.isArray(resources)) {
      return new Response(JSON.stringify({ error: 'resources must be an array' }), {
        status: 400,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      });
    }

    const apiKey = env.PERPLEXITY_API_KEY;
    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'Server misconfigured' }), {
        status: 500,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      });
    }

    const existingNames = resources.map((r) => r.name);

    const [enrichments, sonarResources] = await Promise.all([
      callSonarEnrichment(resources, goalType, apiKey).catch(() => ({})),
      callSonarDiscovery(goalType, existingNames, apiKey).catch(() => []),
    ]);

    return new Response(
      JSON.stringify({ enrichments, sonarResources, queriedAt: Date.now() }),
      { headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } },
    );
  },
};
