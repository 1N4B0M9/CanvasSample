const DEV_PLAN_FIXTURE = {
	query: 'I want a job',
	intent: {
		goalSummary: 'find work',
		assumptions: [],
	},
	steps: [
		{
			id: 'step-1',
			order: 1,
			title: 'Build a resume',
			why: 'A clear resume helps employers see what you can do.',
			resourceNeed: 'resume and job search help',
			assumption: null,
		},
		{
			id: 'step-2',
			order: 2,
			title: 'Find local job openings',
			why: 'Applying to several jobs gives you more chances to find a good fit.',
			resourceNeed: 'local job search help',
			assumption: 'This assumes you are ready to start applying.',
		},
	],
	resourcesByStep: {
		'step-1': [
			{
				name: 'Example Organization',
				blurb: 'Helps people create resumes and prepare for work.',
				phone: '412-555-0100',
				url: 'https://example.org',
				trust: 'verified',
				verifiedAt: '2026-10-15T00:00:00.000Z',
				citations: [],
			},
		],
		'step-2': [
			{
				name: 'Example Job Center',
				blurb: 'Provides local job search and employment support.',
				phone: '412-555-0101',
				url: 'https://example.org/jobs',
				trust: 'web',
				verifiedAt: null,
				citations: [
					{
						title: 'Example Job Center',
						url: 'https://example.org/jobs',
					},
				],
			},
		],
	},
	planMeta: {
		planId: 'dev-fixture-find-work',
		cached: false,
	},
};

export default DEV_PLAN_FIXTURE;
