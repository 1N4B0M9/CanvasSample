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

const VALID_LABELS = new Set(['then', 'requires', 'leads to', 'first', 'finally']);

async function callSubSteps({ goalText, stepText, userQuery }, apiKey) {
  const response = await fetch('https://api.perplexity.ai/chat/completions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'sonar',
      messages: [
        {
          role: 'system',
          content:
            'You are a recovery coach helping people re-entering society. Return only valid JSON, no markdown.',
        },
        {
          role: 'user',
          content:
            `A person is working toward this goal: "${goalText}". ` +
            `They are on this step: "${stepText}". ` +
            `They asked: "${userQuery}". ` +
            `Return 3–5 concrete, actionable sub-steps that help them achieve this specific step. ` +
            `For each sub-step, include a short relationship label (one of: then, requires, leads to, first, finally) ` +
            `describing how it follows from the previous step.\n\n` +
            `Reply ONLY as JSON: { "steps": [{ "text": string, "label": string }] }`,
        },
      ],
      max_tokens: 600,
    }),
  });

  if (!response.ok) throw new Error('Upstream service unavailable');

  const data = await response.json();
  const raw = data?.choices?.[0]?.message?.content?.trim();
  if (!raw) throw new Error('Empty response from Perplexity');

  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error('Perplexity returned non-JSON content');
  }
  if (!parsed?.steps || !Array.isArray(parsed.steps)) {
    throw new Error('Invalid response shape from Perplexity');
  }

  const steps = parsed.steps
    .slice(0, 5)
    .map((s) => ({
      text: String(s.text ?? '').trim(),
      label: VALID_LABELS.has(s.label) ? s.label : 'then',
    }))
    .filter((s) => s.text);

  if (steps.length === 0) throw new Error('Perplexity returned no usable steps');
  return { steps };
}

async function handleSubSteps(request, env) {
  let body;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
      status: 400,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    });
  }

  const { goalText, stepText, userQuery } = body;

  const missingField =
    typeof goalText !== 'string' || !goalText.trim() ||
    typeof stepText !== 'string' || !stepText.trim() ||
    typeof userQuery !== 'string' || !userQuery.trim();

  if (missingField) {
    return new Response(
      JSON.stringify({ error: 'goalText, stepText, and userQuery are required' }),
      { status: 400, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } },
    );
  }

  const apiKey = env.PERPLEXITY_API_KEY;
  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'Server misconfigured' }), {
      status: 500,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    });
  }

  try {
    const result = await callSubSteps({ goalText, stepText, userQuery }, apiKey);
    return new Response(JSON.stringify(result), {
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message || 'Failed to generate sub-steps' }),
      { status: 500, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } },
    );
  }
}

async function handlePathway(request, env) {
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
}

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: CORS_HEADERS });
    }

    if (request.method !== 'POST') {
      return new Response('Method not allowed', { status: 405, headers: CORS_HEADERS });
    }

    const { pathname } = new URL(request.url);

    if (pathname === '/substeps') {
      return handleSubSteps(request, env);
    }

    if (pathname !== '/' && pathname !== '/pathway') {
      return new Response(JSON.stringify({ error: 'Not found' }), {
        status: 404,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      });
    }

    return handlePathway(request, env);
  },
};
