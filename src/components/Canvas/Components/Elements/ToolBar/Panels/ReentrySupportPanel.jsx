import React, { useEffect, useMemo, useState, useCallback } from 'react';
import PropTypes from 'prop-types';

const completionMeta = (isCompleted) => (
	isCompleted
		? { label: 'Completed', className: 'bg-green-100 text-green-700' }
		: { label: 'Not Completed', className: 'bg-gray-100 text-gray-700' }
);

const buildRecommendations = (goalTitle, prompt) => [
	{
		id: `${Date.now()}-resource-1`,
		title: `${goalTitle}: local reentry support network`,
		description: `Start here with a practical first-step plan based on: "${prompt.slice(0, 80)}${prompt.length > 80 ? '...' : ''}"`,
		bookmarked: false,
		survey: null,
	},
	{
		id: `${Date.now()}-resource-2`,
		title: `${goalTitle}: skills and certification opportunities`,
		description: 'Explore short-term opportunities that can create momentum this month.',
		bookmarked: false,
		survey: null,
	},
	{
		id: `${Date.now()}-resource-3`,
		title: `${goalTitle}: employment and housing pathways`,
		description: 'Review options that connect immediate needs with longer-term stability.',
		bookmarked: false,
		survey: null,
	},
];

const GOAL_NODE_TYPES = new Set(['text', 'mentor', 'image']);

const ReentrySupportPanel = ({
	elements,
	arrows,
	goalStateByElementId,
	setGoalStateByElementId,
	fallbackGoals,
	setFallbackGoals,
	onClose,
	variant,
}) => {
	const isDock = variant !== 'overlay';
	const [phase, setPhase] = useState('browse');
	const [goalSubStep, setGoalSubStep] = useState('overview');
	const [selectedGoalId, setSelectedGoalId] = useState(null);
	const [selectedFallbackGoalId, setSelectedFallbackGoalId] = useState(null);
	const [newGoalTitle, setNewGoalTitle] = useState('');
	const [promptDraft, setPromptDraft] = useState('');
	const [editingDescription, setEditingDescription] = useState('');
	const [surveyResourceIds, setSurveyResourceIds] = useState([]);
	const [surveyResourceIdx, setSurveyResourceIdx] = useState(0);
	const [surveyQuestionIdx, setSurveyQuestionIdx] = useState(0);

	const elementsSignature = elements
		.map((element) => `${element.id}:${element.type}:${element.content || ''}:${element.src || ''}`)
		.join('|');
	const arrowsSignature = arrows
		.map((arrow) => `${arrow.id || ''}:${arrow.startId || ''}:${arrow.endId || ''}`)
		.join('|');

	const graphGoals = useMemo(() => {
		const validGoalElements = elements.filter((element) => GOAL_NODE_TYPES.has(element.type));
		const idSet = new Set(validGoalElements.map((element) => element.id));

		const parentIdsByGoal = {};
		const childIdsByGoal = {};
		validGoalElements.forEach((element) => {
			parentIdsByGoal[element.id] = [];
			childIdsByGoal[element.id] = [];
		});

		arrows.forEach((arrow) => {
			if (!idSet.has(arrow.startId) || !idSet.has(arrow.endId)) {
				return;
			}
			parentIdsByGoal[arrow.endId].push(arrow.startId);
			childIdsByGoal[arrow.startId].push(arrow.endId);
		});

		const roots = validGoalElements.filter((element) => parentIdsByGoal[element.id].length === 0).map((element) => element.id);
		const depthByGoal = {};
		const queue = roots.map((id) => ({ id, depth: 0 }));
		while (queue.length > 0) {
			const current = queue.shift();
			if (depthByGoal[current.id] !== undefined && depthByGoal[current.id] <= current.depth) {
				continue;
			}
			depthByGoal[current.id] = current.depth;
			(childIdsByGoal[current.id] || []).forEach((childId) => {
				queue.push({ id: childId, depth: current.depth + 1 });
			});
		}

		const hasCycle = validGoalElements.length > 0 && Object.keys(depthByGoal).length < validGoalElements.length;
		const sorted = [...validGoalElements].sort((a, b) => {
			const depthA = depthByGoal[a.id] ?? 999;
			const depthB = depthByGoal[b.id] ?? 999;
			if (depthA !== depthB) return depthA - depthB;
			return (a.content || '').localeCompare(b.content || '');
		});

		const titleById = {};
		validGoalElements.forEach((element) => {
			titleById[element.id] = (element.content || '').trim() || `${element.type} goal`;
		});

		return sorted.map((element) => {
			const state = goalStateByElementId[element.id] || {};
			return {
				id: element.id,
				type: element.type,
				imageSrc: element.src || '',
				title: titleById[element.id],
				description: state.description || '',
				prompt: state.prompt || '',
				recommendations: state.recommendations || [],
				recommendationOutputSurvey: state.recommendationOutputSurvey || null,
				checkInComplete: Boolean(state.checkInComplete),
				reflection: state.reflection || '',
				lastUpdated: state.lastUpdated || null,
				parentIds: parentIdsByGoal[element.id],
				childIds: childIdsByGoal[element.id],
				parentTitles: parentIdsByGoal[element.id].map((id) => titleById[id] || id),
				childTitles: childIdsByGoal[element.id].map((id) => titleById[id] || id),
				isRoot: parentIdsByGoal[element.id].length === 0,
				isLeaf: childIdsByGoal[element.id].length === 0,
				depth: depthByGoal[element.id] ?? null,
				hasCycle,
			};
		});
	}, [elementsSignature, arrowsSignature, goalStateByElementId]);

	const usingGraphGoals = graphGoals.length > 0;
	const goalsList = usingGraphGoals ? graphGoals : fallbackGoals;

	const selectedGoal = useMemo(() => {
		if (usingGraphGoals) {
			if (!selectedGoalId) return null;
			return graphGoals.find((goal) => goal.id === selectedGoalId) || null;
		}
		if (!selectedFallbackGoalId) return null;
		return fallbackGoals.find((goal) => goal.id === selectedFallbackGoalId) || null;
	}, [usingGraphGoals, graphGoals, selectedGoalId, fallbackGoals, selectedFallbackGoalId]);

	const bookmarkedCount = selectedGoal ? selectedGoal.recommendations.filter((r) => r.bookmarked).length : 0;
	const bookmarkedResources = selectedGoal ? selectedGoal.recommendations.filter((r) => r.bookmarked) : [];
	const isSurveyCompleteForBookmarked = bookmarkedResources.length > 0
		&& bookmarkedResources.every((r) => Boolean(r.survey?.submittedAt));

	const resetResourceSurveyWizard = useCallback(() => {
		setSurveyResourceIds([]);
		setSurveyResourceIdx(0);
		setSurveyQuestionIdx(0);
	}, []);

	const goToBrowse = useCallback(() => {
		setPhase('browse');
		setGoalSubStep('overview');
		setSelectedGoalId(null);
		setSelectedFallbackGoalId(null);
		resetResourceSurveyWizard();
	}, [resetResourceSurveyWizard]);

	const openGoal = useCallback((goal) => {
		if (usingGraphGoals) {
			setSelectedGoalId(goal.id);
		} else {
			setSelectedFallbackGoalId(goal.id);
		}
		setPhase('goal');
		setGoalSubStep('overview');
		resetResourceSurveyWizard();
	}, [usingGraphGoals, resetResourceSurveyWizard]);

	const updateGoal = (goalId, updater) => {
		if (usingGraphGoals) {
			setGoalStateByElementId((prev) => {
				const currentGoal = {
					description: prev[goalId]?.description || '',
					prompt: prev[goalId]?.prompt || '',
					recommendations: prev[goalId]?.recommendations || [],
					recommendationOutputSurvey: prev[goalId]?.recommendationOutputSurvey || null,
					checkInComplete: prev[goalId]?.checkInComplete || false,
					reflection: prev[goalId]?.reflection || '',
					lastUpdated: prev[goalId]?.lastUpdated || null,
				};
				const nextGoal = updater(currentGoal);
				return { ...prev, [goalId]: nextGoal };
			});
			return;
		}
		setFallbackGoals((prev) => prev.map((goal) => (goal.id === goalId ? updater(goal) : goal)));
	};

	const createGoal = () => {
		if (usingGraphGoals) return;
		if (!newGoalTitle.trim()) return;
		const now = new Date().toISOString();
		const newGoal = {
			id: `goal-${Date.now()}`,
			title: newGoalTitle.trim(),
			description: '',
			prompt: '',
			recommendations: [],
			recommendationOutputSurvey: null,
			checkInComplete: false,
			reflection: '',
			lastUpdated: now,
		};
		setFallbackGoals((prev) => [newGoal, ...prev]);
		setSelectedFallbackGoalId(newGoal.id);
		setEditingDescription('');
		setPromptDraft('');
		setNewGoalTitle('');
		setPhase('goal');
		setGoalSubStep('overview');
		resetResourceSurveyWizard();
	};

	const deleteGoal = (goalId) => {
		if (usingGraphGoals) return;
		setFallbackGoals((prev) => prev.filter((goal) => goal.id !== goalId));
		if (selectedFallbackGoalId === goalId) {
			goToBrowse();
		}
	};

	useEffect(() => {
		if (!selectedGoal) return;
		setEditingDescription(selectedGoal.description || '');
		setPromptDraft(selectedGoal.prompt || '');
	}, [selectedGoal?.id]);

	const submitPrompt = () => {
		if (!selectedGoal || selectedGoal.prompt) return;
		if (!promptDraft.trim()) return;

		updateGoal(selectedGoal.id, (goal) => ({
			...goal,
			prompt: promptDraft.trim(),
			recommendations: buildRecommendations(goal.title, promptDraft.trim()),
			lastUpdated: new Date().toISOString(),
		}));
		resetResourceSurveyWizard();
		setGoalSubStep('recommendations');
	};

	const toggleBookmark = (resourceId) => {
		if (!selectedGoal) return;
		updateGoal(selectedGoal.id, (goal) => ({
			...goal,
			recommendations: goal.recommendations.map((resource) => (
				resource.id === resourceId ? { ...resource, bookmarked: !resource.bookmarked } : resource
			)),
			lastUpdated: new Date().toISOString(),
		}));
	};

	const saveGoalEdits = () => {
		if (!selectedGoal) return;
		updateGoal(selectedGoal.id, (goal) => ({
			...goal,
			description: editingDescription.trim(),
			lastUpdated: new Date().toISOString(),
		}));
	};

	const saveGoalEditsAndContinueToPrompt = () => {
		saveGoalEdits();
		setGoalSubStep('prompt');
	};

	const updateResourceSurvey = (resourceId, updates) => {
		if (!selectedGoal) return;
		updateGoal(selectedGoal.id, (goal) => {
			return {
				...goal,
				recommendations: goal.recommendations.map((resource) => {
					if (resource.id !== resourceId) return resource;
					const nextSurvey = {
						helpfulnessScore: resource.survey?.helpfulnessScore ?? 1,
						resourceHelpedText: resource.survey?.resourceHelpedText || '',
						...updates,
					};
					return { ...resource, survey: nextSurvey };
				}),
				lastUpdated: new Date().toISOString(),
			};
		});
	};

	const submitResourceSurvey = (resourceId) => {
		if (!selectedGoal) return;
		updateGoal(selectedGoal.id, (goal) => {
			const resource = goal.recommendations.find((r) => r.id === resourceId);
			if (!resource) return goal;
			const currentSurvey = resource.survey || {};
			const isComplete = currentSurvey.helpfulnessScore >= 1
				&& currentSurvey.helpfulnessScore <= 10
				&& Boolean(currentSurvey.resourceHelpedText?.trim());
			if (!isComplete) return goal;
			// IMPORTANT: Keep this submission timestamp. Future reporting/planning depends on exact date-time of completed resource surveys.
			const submittedAt = new Date().toISOString();
			return {
				...goal,
				recommendations: goal.recommendations.map((r) => (
					r.id === resourceId ? { ...r, survey: { ...currentSurvey, submittedAt } } : r
				)),
				lastUpdated: submittedAt,
			};
		});
	};

	const startResourceSurveyWizard = () => {
		if (!selectedGoal) return;
		const ids = selectedGoal.recommendations.filter((r) => r.bookmarked).map((r) => r.id);
		if (ids.length === 0) return;
		setSurveyResourceIds(ids);
		setSurveyResourceIdx(0);
		setSurveyQuestionIdx(0);
		setPhase('resource_survey');
	};

	const breadcrumbLabel = () => {
		if (phase === 'browse') return 'Goals';
		if (phase === 'resource_survey') {
			return `Resource Survey · ${surveyResourceIdx + 1} of ${surveyResourceIds.length} · Question ${surveyQuestionIdx + 1} of 2`;
		}
		const stepNames = { overview: 'Overview', prompt: 'Support prompt', recommendations: 'Recommendations' };
		return `Goal · ${selectedGoal?.title || ''} · ${stepNames[goalSubStep] || ''}`;
	};

	const rootClassName = isDock
		? 'h-full min-h-0 w-full flex flex-col bg-white overflow-hidden'
		: 'absolute left-1/2 top-20 -translate-x-1/2 z-50 w-[1040px] max-w-[95vw] h-[78vh] bg-white border border-gray-200 rounded-2xl shadow-2xl overflow-hidden';

	const bodyClassName = isDock
		? 'flex flex-1 min-h-0 flex-col overflow-hidden'
		: 'flex h-[calc(78vh-58px)] min-h-0 flex-col overflow-hidden';

	const renderBrowse = () => (
		<div className="flex flex-1 min-h-0 flex-col overflow-y-auto p-3">
			<p className="mb-3 text-sm text-gray-600">Select a goal to continue.</p>
			{!usingGraphGoals && (
				<div className="mb-3 flex gap-2">
					<input
						value={newGoalTitle}
						onChange={(e) => setNewGoalTitle(e.target.value)}
						placeholder="Add a vision board goal..."
						className="min-w-0 flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm"
					/>
					<button type="button" onClick={createGoal} className="shrink-0 rounded-lg bg-blue-600 px-3 py-2 text-sm text-white hover:bg-blue-700">
						Add
					</button>
				</div>
			)}
			<div className="space-y-2">
				{goalsList.map((goal, index) => {
					const statusMeta = completionMeta(goal.checkInComplete);
					const shadeSource = usingGraphGoals ? (goal.depth ?? 0) : index;
					const shadeStep = Math.min(Math.max(shadeSource, 0), 8);
					const cardBorderClass = goal.checkInComplete ? 'border-green-200' : 'border-gray-200';
					const baseLightness = goal.checkInComplete ? 94 : 98;
					const lightness = Math.max(baseLightness - (shadeStep * 4), goal.checkInComplete ? 68 : 70);
					const cardBackgroundColor = goal.checkInComplete
						? `hsl(145 45% ${lightness}%)`
						: `hsl(220 14% ${lightness}%)`;
					return (
						<div
							key={goal.id}
							className={`rounded-xl border ${cardBorderClass}`}
							style={{ backgroundColor: cardBackgroundColor }}
						>
							{!usingGraphGoals && (
								<div className="flex justify-end border-b border-gray-50 px-2 py-1">
									<button type="button" className="text-xs text-red-600 hover:text-red-700" onClick={() => deleteGoal(goal.id)}>
										Delete
									</button>
								</div>
							)}
							<button
								type="button"
								className="w-full p-3 text-left"
								onClick={() => openGoal(goal)}
							>
								<p className="text-sm font-medium text-gray-900">
									{goal.type === 'image' && goal.imageSrc ? (
										<img
											src={goal.imageSrc}
											alt="Goal"
											className="inline-block h-8 w-8 rounded object-cover align-middle"
										/>
									) : goal.title}
								</p>
								<div className="mt-2 flex items-center justify-between">
									<span className={`rounded-full px-2 py-1 text-xs ${statusMeta.className}`}>{statusMeta.label}</span>
									<span className="text-xs text-gray-500">{goal.recommendations.filter((r) => r.bookmarked).length} bookmarks</span>
								</div>
							</button>
						</div>
					);
				})}
			</div>
			{goalsList.length === 0 && (
				<div className="mt-6 rounded-lg border border-dashed border-gray-300 p-4 text-center text-sm text-gray-500">
					{usingGraphGoals ? 'Add text or mentor goals on the canvas to see them here.' : 'Add a goal above to get started.'}
				</div>
			)}
		</div>
	);

	const renderGoalWorkspace = () => {
		if (!selectedGoal) return null;
		const blockBackNavigation = goalSubStep === 'recommendations' && bookmarkedCount > 0 && !isSurveyCompleteForBookmarked;
		return (
			<div className="flex flex-1 min-h-0 flex-col overflow-hidden">
				<div className="flex shrink-0 items-center gap-2 border-b border-gray-100 px-3 py-2">
					<button
						type="button"
						disabled={blockBackNavigation}
						onClick={() => { if (!blockBackNavigation) goToBrowse(); }}
						className={`text-sm font-medium ${blockBackNavigation ? 'cursor-not-allowed text-gray-400' : 'text-blue-600 hover:text-blue-800'}`}
					>
						← Back to goals
					</button>
				</div>
				<div className="flex flex-1 min-h-0 flex-col overflow-y-auto p-4">
					{goalSubStep === 'overview' && (
						<div className="space-y-4">
							<div className="rounded-xl border border-gray-200 p-4">
								<h4 className="mb-3 text-sm font-semibold text-gray-800">Goal overview</h4>
								<div className="grid gap-3 sm:grid-cols-2">
									<div>
										<label className="text-xs text-gray-500">Goal title</label>
										<div className="mt-1 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm">
											{selectedGoal.type === 'image' && selectedGoal.imageSrc ? (
												<img
													src={selectedGoal.imageSrc}
													alt="Goal"
													className="h-12 w-12 rounded object-cover"
												/>
											) : selectedGoal.title}
										</div>
									</div>
									<div>
										<label className="text-xs text-gray-500">Status</label>
										<label className="mt-1 flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-800">
											<input
												type="checkbox"
												checked={selectedGoal.checkInComplete}
												onChange={(e) => {
													const checked = e.target.checked;
													updateGoal(selectedGoal.id, (goal) => ({
														...goal,
														checkInComplete: checked,
														lastUpdated: new Date().toISOString(),
													}));
												}}
												className="h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
											/>
											<span>{selectedGoal.checkInComplete ? 'Completed' : 'Not Completed'}</span>
										</label>
									</div>
								</div>
								<div className="mt-3">
									<label className="text-xs text-gray-500">Description</label>
									<textarea
										value={editingDescription}
										onChange={(e) => setEditingDescription(e.target.value)}
										rows={3}
										className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
									/>
								</div>
								<button type="button" onClick={saveGoalEdits} className="mt-3 rounded-lg bg-gray-800 px-3 py-2 text-sm text-white hover:bg-gray-900">
									Save
								</button>
							</div>
							<button
								type="button"
								onClick={saveGoalEditsAndContinueToPrompt}
								className="w-full rounded-lg bg-blue-600 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
							>
								Continue to Recomendations
							</button>
						</div>
					)}

					{goalSubStep === 'prompt' && (
						<div className="space-y-4">
							<div className="rounded-xl border border-gray-200 p-4">
								<h4 className="mb-2 text-sm font-semibold text-gray-800">Support prompt (one per goal)</h4>
								<textarea
									value={promptDraft}
									onChange={(e) => setPromptDraft(e.target.value)}
									disabled={Boolean(selectedGoal.prompt)}
									placeholder="Describe what support you need for this goal..."
									rows={4}
									className={`w-full rounded-lg border px-3 py-2 text-sm ${selectedGoal.prompt ? 'border-gray-200 bg-gray-100 text-gray-500' : 'border-gray-300'
										}`}
								/>
								<p className="mt-2 text-xs text-gray-500">
									{selectedGoal.prompt
										? 'Recommendations are already generated for this goal.'
										: 'Submit to generate recommendations for this goal.'}
								</p>
								<div className="mt-3 flex flex-wrap gap-2">
									<button type="button" onClick={() => setGoalSubStep('overview')} className="rounded-lg border border-gray-300 px-3 py-2 text-sm hover:bg-gray-50">
										Back
									</button>
									{!selectedGoal.prompt ? (
										<button
											type="button"
											onClick={submitPrompt}
											disabled={!promptDraft.trim()}
											className={`rounded-lg px-3 py-2 text-sm font-medium ${!promptDraft.trim() ? 'cursor-not-allowed bg-gray-200 text-gray-500' : 'bg-blue-600 text-white hover:bg-blue-700'
												}`}
										>
											Get recommendations
										</button>
									) : (
										<button
											type="button"
											onClick={() => setGoalSubStep('recommendations')}
											className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700"
										>
											Continue to recommendations
										</button>
									)}
								</div>
							</div>
						</div>
					)}

					{goalSubStep === 'recommendations' && (
						<div className="space-y-4">
							<div className="rounded-xl border border-gray-200 p-4">
								<>
									<div className="mb-3 flex items-center justify-between">
										<h4 className="text-sm font-semibold text-gray-800">Recommendations</h4>
										<span className="text-xs text-gray-500">
											{bookmarkedCount === 0 ? 'No bookmarks yet' : `${bookmarkedCount} bookmarked`}
										</span>
									</div>
									{selectedGoal.recommendations.length === 0 ? (
										<div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-3 text-sm text-gray-500">
											Submit a support prompt first to see recommendations.
										</div>
									) : (
										<div className="space-y-3">
											{selectedGoal.recommendations.map((resource) => (
												<div key={resource.id} className="rounded-lg border border-gray-200 p-3">
													<div className="flex items-start justify-between gap-3">
														<div>
															<p className="text-sm font-medium text-gray-900">{resource.title}</p>
															<p className="mt-1 text-xs text-gray-600">{resource.description}</p>
														</div>
														<button
															type="button"
															onClick={() => toggleBookmark(resource.id)}
															className={`shrink-0 rounded px-2.5 py-1 text-xs ${resource.bookmarked
																? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
																: 'bg-gray-100 text-gray-700 hover:bg-gray-200'
																}`}
														>
															{resource.bookmarked ? 'Bookmarked' : 'Bookmark'}
														</button>
													</div>
												</div>
											))}
										</div>
									)}
									<p className="mt-3 text-xs text-gray-500">
										After bookmarking resources, complete the survey wizard for each bookmarked resource.
									</p>
									<div className="mt-3 flex flex-wrap gap-2">
										<button
											type="button"
											onClick={startResourceSurveyWizard}
											disabled={bookmarkedCount === 0}
											className={`rounded-lg px-3 py-2 text-sm font-medium ${bookmarkedCount === 0
													? 'cursor-not-allowed bg-gray-200 text-gray-500'
													: 'bg-blue-600 text-white hover:bg-blue-700'
												}`}
										>
											{isSurveyCompleteForBookmarked ? 'Review resource survey' : 'Start resource survey'}
										</button>
										<button
											type="button"
											disabled={bookmarkedCount > 0 && !isSurveyCompleteForBookmarked}
											onClick={() => setGoalSubStep(selectedGoal.prompt ? 'prompt' : 'overview')}
											className={`rounded-lg border px-3 py-2 text-sm ${(bookmarkedCount === 0 || isSurveyCompleteForBookmarked)
													? 'border-gray-300 hover:bg-gray-50'
													: 'cursor-not-allowed border-gray-200 text-gray-400'
												}`}
										>
											Back
										</button>
									</div>
								</>
							</div>
						</div>
					)}
				</div>
			</div>
		);
	};

	const renderResourceSurveyWizard = () => {
		if (!selectedGoal || surveyResourceIds.length === 0) return null;
		const currentResourceId = surveyResourceIds[surveyResourceIdx];
		const currentResource = selectedGoal.recommendations.find((r) => r.id === currentResourceId);
		if (!currentResource) return null;

		const surveyData = currentResource.survey || {};
		const currentScore = surveyData.helpfulnessScore ?? 1;
		const currentText = surveyData.resourceHelpedText || '';
		const canAdvance = surveyQuestionIdx === 0
			? currentScore >= 1 && currentScore <= 10
			: Boolean(currentText.trim());
		const canGoBack = true;

		const goNext = () => {
			if (!canAdvance) return;
			if (surveyQuestionIdx === 0) {
				setSurveyQuestionIdx(1);
				return;
			}
			submitResourceSurvey(currentResourceId);
			const isLastResource = surveyResourceIdx >= surveyResourceIds.length - 1;
			if (isLastResource) {
				setPhase('goal');
				setGoalSubStep('recommendations');
				resetResourceSurveyWizard();
				return;
			}
			setSurveyResourceIdx((idx) => idx + 1);
			setSurveyQuestionIdx(0);
		};

		const goBack = () => {
			if (surveyQuestionIdx === 1) {
				setSurveyQuestionIdx(0);
				return;
			}
			if (surveyResourceIdx === 0) {
				setPhase('goal');
				setGoalSubStep('recommendations');
				return;
			}
			setSurveyResourceIdx((idx) => idx - 1);
			setSurveyQuestionIdx(1);
		};

		return (
			<div className="flex flex-1 min-h-0 flex-col overflow-hidden p-4">
				<div className="rounded-xl border border-gray-200 p-4">
					<button
						type="button"
						onClick={() => {
							setPhase('goal');
							setGoalSubStep('recommendations');
						}}
						className="mb-3 text-sm font-medium text-blue-600 hover:text-blue-800"
					>
						← Back to resources
					</button>
					<p className="text-sm font-semibold text-gray-800">{currentResource.title}</p>
					<p className="mt-1 text-xs text-gray-500">Resource {surveyResourceIdx + 1} of {surveyResourceIds.length}</p>

					{surveyQuestionIdx === 0 && (
						<div className="mt-4">
							<p className="text-sm text-gray-800">How helpful was this on a scale of 1-10?</p>
							<input
								type="range"
								min="1"
								max="10"
								step="1"
								value={currentScore}
								onChange={(e) => updateResourceSurvey(currentResourceId, {
									helpfulnessScore: Number(e.target.value),
									submittedAt: null,
								})}
								className="mt-3 w-full accent-blue-600"
							/>
							<p className="mt-2 text-xs text-gray-600">Selected score: {currentScore}</p>
						</div>
					)}

					{surveyQuestionIdx === 1 && (
						<div className="mt-4">
							<p className="text-sm text-gray-800">Has this resource helped you get what you were looking for?</p>
							<textarea
								value={currentText}
								onChange={(e) => updateResourceSurvey(currentResourceId, {
									resourceHelpedText: e.target.value,
									submittedAt: null,
								})}
								rows={4}
								placeholder="Type your response..."
								className="mt-3 w-full rounded border border-gray-300 px-3 py-2 text-sm"
							/>
						</div>
					)}

					<div className="mt-5 flex items-center justify-between border-t border-gray-100 pt-4">
						<button
							type="button"
							onClick={goBack}
							disabled={!canGoBack}
							className={`rounded-lg px-3 py-2 text-sm ${canGoBack ? 'border border-gray-300 hover:bg-gray-50' : 'cursor-not-allowed text-gray-400'}`}
						>
							Back
						</button>
						<button
							type="button"
							onClick={goNext}
							disabled={!canAdvance}
							className={`rounded-lg px-4 py-2 text-sm font-medium ${canAdvance ? 'bg-blue-600 text-white hover:bg-blue-700' : 'cursor-not-allowed bg-gray-200 text-gray-500'}`}
						>
							{surveyQuestionIdx === 0 ? 'Next' : (surveyResourceIdx >= surveyResourceIds.length - 1 ? 'Submit all' : 'Next resource')}
						</button>
					</div>
				</div>
			</div>
		);
	};

	return (
		<div className={rootClassName}>
			<div className="flex shrink-0 flex-col border-b border-gray-200 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
				<div className="min-w-0">
					<h3 className="text-lg font-semibold text-gray-900">Recommendation Tool</h3>
					<p className="truncate text-xs text-gray-500">{breadcrumbLabel()}</p>
				</div>
				<button type="button" onClick={onClose} className="mt-2 shrink-0 rounded-lg bg-gray-100 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-200 sm:mt-0">
					Close
				</button>
			</div>

			<div className={bodyClassName}>
				{phase === 'browse' && renderBrowse()}
				{phase === 'goal' && renderGoalWorkspace()}
				{phase === 'resource_survey' && renderResourceSurveyWizard()}
			</div>
		</div>
	);
};

ReentrySupportPanel.propTypes = {
	elements: PropTypes.arrayOf(PropTypes.shape({
		id: PropTypes.string.isRequired,
		type: PropTypes.string.isRequired,
		content: PropTypes.string,
	})).isRequired,
	arrows: PropTypes.arrayOf(PropTypes.shape({
		id: PropTypes.string,
		startId: PropTypes.string,
		endId: PropTypes.string,
	})).isRequired,
	goalStateByElementId: PropTypes.objectOf(PropTypes.shape({
		description: PropTypes.string,
		prompt: PropTypes.string,
		recommendations: PropTypes.array,
		recommendationOutputSurvey: PropTypes.shape({
			helpfulnessScore: PropTypes.number,
			resourceHelpedText: PropTypes.string,
			submittedAt: PropTypes.string,
		}),
		checkInComplete: PropTypes.bool,
		reflection: PropTypes.string,
		lastUpdated: PropTypes.string,
	})).isRequired,
	setGoalStateByElementId: PropTypes.func.isRequired,
	fallbackGoals: PropTypes.arrayOf(PropTypes.shape({
		id: PropTypes.string.isRequired,
		title: PropTypes.string.isRequired,
		description: PropTypes.string,
		prompt: PropTypes.string,
		recommendations: PropTypes.array,
		recommendationOutputSurvey: PropTypes.shape({
			helpfulnessScore: PropTypes.number,
			resourceHelpedText: PropTypes.string,
			submittedAt: PropTypes.string,
		}),
		checkInComplete: PropTypes.bool,
		reflection: PropTypes.string,
		lastUpdated: PropTypes.string,
	})).isRequired,
	setFallbackGoals: PropTypes.func.isRequired,
	onClose: PropTypes.func.isRequired,
	variant: PropTypes.oneOf(['dock', 'overlay']),
};

ReentrySupportPanel.defaultProps = {
	variant: 'dock',
};

export default ReentrySupportPanel;
