import React, { useCallback, useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import PathStackHint from './PathStackHint';

/* eslint-disable jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions */

const PathStackPreview = ({ element, path, onExpandedChange, onUpdatePath }) => {
	const { scale = 1, rotation = 0 } = element;
	const { steps } = path;
	const activeSteps = steps.filter((step) => !step.done);
	const completedSteps = steps.filter((step) => step.done);
	const [isExpanded, setIsExpanded] = useState(false);
	const [activeIndex, setActiveIndex] = useState(0);
	const [cycleDirection, setCycleDirection] = useState(1);
	const [isCycling, setIsCycling] = useState(false);
	const [isCompleting, setIsCompleting] = useState(false);
	const [completionNotice, setCompletionNotice] = useState(null);
	const rootRef = useRef(null);
	const cycleTimeoutRef = useRef(null);
	const completionTimeoutRef = useRef(null);
	const noticeTimeoutRef = useRef(null);
	const activeStep = activeSteps[activeIndex] ?? activeSteps[0] ?? null;

	const setExpanded = useCallback(
		(expanded) => {
			setIsExpanded(expanded);
			onExpandedChange(expanded);
		},
		[onExpandedChange],
	);

	const cycleTo = (nextIndex, direction) => {
		if (isCycling || activeSteps.length < 2) return;
		setCycleDirection(direction);
		setIsCycling(true);
		cycleTimeoutRef.current = window.setTimeout(() => {
			setActiveIndex(nextIndex);
			setIsCycling(false);
		}, 180);
	};

	const updateStepDone = (stepId, done) => {
		onUpdatePath({
			...path,
			steps: steps.map((step) =>
				step.id === stepId
					? { ...step, done, doneAt: done ? step.doneAt || new Date().toISOString() : null }
					: step,
			),
		});
	};

	const completeActiveStep = () => {
		if (!activeStep || isCompleting) return;
		setIsCompleting(true);
		completionTimeoutRef.current = window.setTimeout(() => {
			updateStepDone(activeStep.id, true);
			setIsCompleting(false);
			setCompletionNotice(`Step completed · ${activeStep.title}`);
			if (noticeTimeoutRef.current) window.clearTimeout(noticeTimeoutRef.current);
			noticeTimeoutRef.current = window.setTimeout(() => setCompletionNotice(null), 3500);
		}, 220);
	};

	const undoStep = (stepId, title) => {
		updateStepDone(stepId, false);
		setCompletionNotice(`Undo · ${title}`);
		if (noticeTimeoutRef.current) window.clearTimeout(noticeTimeoutRef.current);
		noticeTimeoutRef.current = window.setTimeout(() => setCompletionNotice(null), 3500);
	};

	const handleCardKeyDown = (event) => {
		if (event.key === 'ArrowRight') {
			event.preventDefault();
			cycleTo((activeIndex + 1) % activeSteps.length, 1);
		} else if (event.key === 'ArrowLeft') {
			event.preventDefault();
			cycleTo((activeIndex - 1 + activeSteps.length) % activeSteps.length, -1);
		} else if (event.key === 'Escape') {
			event.preventDefault();
			setExpanded(false);
		}
	};

	useEffect(() => {
		setActiveIndex((index) => Math.min(index, Math.max(activeSteps.length - 1, 0)));
	}, [path.createdAt, activeSteps.length]);

	useEffect(
		() => () => {
			if (cycleTimeoutRef.current) window.clearTimeout(cycleTimeoutRef.current);
			if (completionTimeoutRef.current) window.clearTimeout(completionTimeoutRef.current);
			if (noticeTimeoutRef.current) window.clearTimeout(noticeTimeoutRef.current);
		},
		[],
	);

	useEffect(() => {
		if (!isExpanded) return undefined;

		const handleOutsidePointerDown = (event) => {
			if (!rootRef.current?.contains(event.target)) setExpanded(false);
		};
		const handleEscape = (event) => {
			if (event.key === 'Escape') {
				event.preventDefault();
				setExpanded(false);
			}
		};

		document.addEventListener('pointerdown', handleOutsidePointerDown, true);
		window.addEventListener('keydown', handleEscape);
		return () => {
			document.removeEventListener('pointerdown', handleOutsidePointerDown, true);
			window.removeEventListener('keydown', handleEscape);
		};
	}, [isExpanded, setExpanded]);

	if (!steps.length) return null;

	let cardTransitionClass = 'translate-x-0 opacity-100';
	if (isCycling) cardTransitionClass = cycleDirection > 0 ? 'translate-x-4 opacity-0' : '-translate-x-4 opacity-0';
	if (isCompleting) cardTransitionClass = '-translate-y-3 scale-95 opacity-0';

	return (
		<div
			ref={rootRef}
			className="absolute left-0 top-full z-10 mt-2 text-left"
			style={{
				transform: `rotate(${-rotation}deg) scale(${1 / scale})`,
				transformOrigin: 'top left',
			}}
			onMouseDown={(event) => event.stopPropagation()}
			onClick={(event) => event.stopPropagation()}
			draggable={false}
			data-path-preview="true"
		>
			{!isExpanded ? (
				<PathStackHint stepCount={steps.length} onExpand={() => setExpanded(true)} />
			) : (
				<div className="w-[320px]">
					<div className="relative h-3">
						<div className="absolute left-3 top-1 h-3 w-[calc(100%-1.5rem)] rotate-1 rounded border border-[#D3D3D3] bg-[#D9E9F5] shadow-sm" />
						<div className="absolute left-1 top-0 h-3 w-[calc(100%-1.5rem)] -rotate-1 rounded border border-[#D3D3D3] bg-[#ECF4FA] shadow-sm" />
					</div>
					<div className="rounded-xl border border-[#D3D3D3] bg-white p-4 shadow-xl">
						<div className="flex items-center justify-between gap-2">
							<p className="min-w-0 truncate text-sm font-bold text-[#053254]">
								{path.goalSummary || path.goal || 'Goal path'}
							</p>
							<button
								type="button"
								className="min-h-[36px] rounded px-2 text-lg font-bold text-[#053254] hover:bg-[#ECF4FA] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#1665c0]"
								onClick={() => setExpanded(false)}
								aria-label="Collapse goal path"
							>
								×
							</button>
						</div>
						<p className="mt-2 text-sm font-bold text-[#44546A]">
							{completedSteps.length} of {steps.length} done
						</p>
						{completionNotice && (
							<div className="mt-2 rounded-lg bg-[#EAF6EF] px-3 py-2 text-sm font-bold text-[#1B7A43]" role="status">
								{completionNotice}
							</div>
						)}
						{activeStep ? (
							<>
								<div className="mt-3 flex items-center justify-between gap-2">
									<button
										type="button"
										className="min-h-[44px] min-w-[44px] rounded-full border border-[#D3D3D3] text-lg font-bold text-[#053254] hover:bg-[#ECF4FA] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#1665c0] disabled:opacity-40"
										onClick={() =>
											cycleTo((activeIndex - 1 + activeSteps.length) % activeSteps.length, -1)
										}
										disabled={activeSteps.length < 2 || isCycling || isCompleting}
										aria-label="Previous goal step"
									>
										←
									</button>
									<p className="text-sm font-bold text-[#44546A]">
										Step {activeStep.order} of {steps.length}
									</p>
									<span className="w-[44px]" aria-hidden="true" />
								</div>
								<button
									type="button"
									className={`mt-3 w-full rounded-xl border border-[#D3D3D3] bg-[#F8FBFD] p-4 text-left shadow-sm transition-all duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#1665c0] ${cardTransitionClass}`}
									onClick={() => cycleTo((activeIndex + 1) % activeSteps.length, 1)}
									onKeyDown={handleCardKeyDown}
									disabled={activeSteps.length < 2 || isCycling || isCompleting}
									aria-label={`${activeStep.title}. Step ${activeStep.order} of ${steps.length}. Use arrow keys to change steps.`}
								>
									<p className="text-base font-bold text-[#053254]">{activeStep.title}</p>
									{activeStep.why && <p className="mt-1 text-sm text-[#111827]">{activeStep.why}</p>}
									{activeStep.resources?.length > 0 && (
										<ul className="mt-2 flex list-disc flex-col gap-1 pl-4 text-xs text-[#44546A]">
											{activeStep.resources.map((resource) => (
												<li key={`${activeStep.id}-${resource.name}`}>
													{resource.name}
													{resource.phone ? ` — ${resource.phone}` : ''}
													{resource.url && (
														<a
															className="ml-1 text-[#1665c0] underline"
															href={resource.url}
															target="_blank"
															rel="noopener noreferrer"
															onMouseDown={(event) => event.stopPropagation()}
															onClick={(event) => event.stopPropagation()}
														>
															Website
														</a>
													)}
												</li>
											))}
										</ul>
									)}
									<p className="mt-3 text-xs font-bold text-[#1665c0]">Click card for next step</p>
								</button>
								<button
									type="button"
									className="mt-2 min-h-[44px] w-full rounded-lg bg-[#1B7A43] px-3 text-sm font-bold text-white hover:bg-[#166535] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#053254] disabled:opacity-60"
									onClick={completeActiveStep}
									disabled={isCompleting}
								>
									✓ Mark step complete
								</button>
							</>
						) : (
							<p className="mt-4 rounded-lg bg-[#EAF6EF] p-3 text-sm font-bold text-[#1B7A43]">
								All steps completed.
							</p>
						)}
						{completedSteps.length > 0 && (
							<div className="mt-4 border-t border-[#D3D3D3] pt-3">
								<p className="text-sm font-bold text-[#053254]">Completed steps</p>
								<ul className="mt-2 flex flex-col gap-2">
									{completedSteps.map((step) => (
										<li
											key={step.id}
											className="flex items-center justify-between gap-2 rounded-lg bg-[#EAF6EF] px-3 py-2 text-sm text-[#1B7A43]"
										>
											<span className="line-through">{step.title}</span>
											<button
												type="button"
												className="min-h-[36px] rounded px-2 font-bold underline hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#1665c0]"
												onClick={() => undoStep(step.id, step.title)}
											>
												Undo
											</button>
										</li>
									))}
								</ul>
							</div>
						)}
					</div>
				</div>
			)}
		</div>
	);
};

PathStackPreview.propTypes = {
	element: PropTypes.shape({
		scale: PropTypes.number,
		rotation: PropTypes.number,
	}).isRequired,
	path: PropTypes.shape({
		goal: PropTypes.string,
		goalSummary: PropTypes.string,
		createdAt: PropTypes.string,
		steps: PropTypes.arrayOf(
			PropTypes.shape({
				id: PropTypes.string.isRequired,
				order: PropTypes.number.isRequired,
				title: PropTypes.string.isRequired,
				why: PropTypes.string,
				done: PropTypes.bool,
				doneAt: PropTypes.string,
				resources: PropTypes.arrayOf(PropTypes.shape({})),
			}),
		).isRequired,
	}).isRequired,
	onExpandedChange: PropTypes.func,
	onUpdatePath: PropTypes.func.isRequired,
};

PathStackPreview.defaultProps = {
	onExpandedChange: () => {},
};

export default PathStackPreview;
