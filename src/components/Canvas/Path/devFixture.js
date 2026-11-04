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
		{
			id: 'step-3',
			order: 3,
			title: 'Practice interview answers',
			why: 'Practice can help you feel more ready when an employer calls.',
			resourceNeed: 'interview preparation help',
			assumption: null,
		},
		{
			id: 'step-4',
			order: 4,
			title: 'Apply to a few jobs',
			why: 'Sending a few applications gives you more than one chance.',
			resourceNeed: 'job application support',
			assumption: null,
		},
		{
			id: 'step-5',
			order: 5,
			title: 'Follow up after applying',
			why: 'A short follow-up can show employers that you are still interested.',
			resourceNeed: 'job application follow-up help',
			assumption: null,
		},
	],
	resourcesByStep: {
		'step-1': [
			{
				name: 'Example Organization',
				blurb: 'Helps people create resumes and prepare for work.',
				phone: '412-555-0100',
				url: 'https://www.indeed.com/career-advice/resumes-cover-letters',
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
				url: 'https://www.careerlink.com/',
				trust: 'web',
				verifiedAt: null,
				citations: [
					{
						title: 'Example Job Center',
						url: 'https://www.careerlink.com/',
					},
				],
			},
		],
		'step-3': [
			{
				name: 'Example Career Coach',
				blurb: 'Helps people practice interviews and prepare answers.',
				phone: '412-555-0102',
				url: 'https://www.linkedin.com/learning/',
				trust: 'verified',
				verifiedAt: '2026-10-15T00:00:00.000Z',
				citations: [],
			},
		],
		'step-4': [
			{
				name: 'Example Application Lab',
				blurb: 'Provides help with online job applications.',
				phone: '412-555-0103',
				url: 'https://www.usa.gov/job-search',
				trust: 'web',
				verifiedAt: null,
				citations: [],
			},
		],
		'step-5': [
			{
				name: 'Example Job Center',
				blurb: 'Helps job seekers follow up and stay organized.',
				phone: '412-555-0101',
				url: 'https://www.indeed.com/career-advice/interviewing/follow-up-email-after-interview',
				trust: 'verified',
				verifiedAt: '2026-10-15T00:00:00.000Z',
				citations: [],
			},
		],
	},
	planMeta: {
		planId: 'dev-fixture-find-work',
		cached: false,
	},
};

export default DEV_PLAN_FIXTURE;
