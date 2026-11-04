import React, { useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import PathStackHint from './PathStackHint';

/* eslint-disable jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions */

const PathStackPreview = ({ element, path, isExpanded, onExpandedChange, onUpdatePath, children }) => {
	const { scale = 1, rotation = 0 } = element;
	const { steps } = path;
	const activeSteps = steps.filter((step) => !step.done);
	const completedSteps = steps.filter((step) => step.done);
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
			onExpandedChange(false);
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
			if (!rootRef.current?.contains(event.target)) onExpandedChange(false);
		};
		const handleEscape = (event) => {
			if (event.key === 'Escape') {
				event.preventDefault();
				onExpandedChange(false);
			}
		};

		document.addEventListener('pointerdown', handleOutsidePointerDown, true);
		window.addEventListener('keydown', handleEscape);
		return () => {
			document.removeEventListener('pointerdown', handleOutsidePointerDown, true);
			window.removeEventListener('keydown', handleEscape);
		};
	}, [isExpanded, onExpandedChange]);

	if (!steps.length) return null;

	let cardTransitionClass = 'translate-x-0 opacity-100';
	if (isCycling) cardTransitionClass = cycleDirection > 0 ? 'translate-x-4 opacity-0' : '-translate-x-4 opacity-0';
	if (isCompleting) cardTransitionClass = '-translate-y-3 scale-95 opacity-0';

	return (
		<div
			ref={rootRef}
			className="relative text-left"
			style={{
				width: element.width || 300,
				height: element.height || 220,
			}}
			onMouseDown={(event) => {
				if (isExpanded) event.stopPropagation();
			}}
			onClick={(event) => {
				if (isExpanded) event.stopPropagation();
			}}
			draggable={false}
			data-path-preview="true"
		>
			<div className={`pointer-events-none absolute inset-0 transition-opacity duration-200 ${isExpanded ? 'opacity-0' : 'opacity-100'}`}>
				<PathStackHint
					cardCount={steps.length}
					width={element.width || 300}
					height={element.height || 220}
					scale={scale}
				/>
			</div>
			<div
				className={`absolute inset-0 z-20 transition-all duration-200 ${
					isExpanded ? 'translate-y-[-12px] opacity-0' : 'translate-y-0 opacity-100'
				}`}
				style={{ pointerEvents: isExpanded ? 'none' : 'auto' }}
			>
				{children}
			</div>
			{isExpanded && (
				<div
					className="absolute inset-0 z-30 overflow-hidden rounded-xl border border-[#D3D3D3] bg-white shadow-xl"
					style={{
						transform: `rotate(${-rotation}deg)`,
						transformOrigin: 'center',
					}}
				>
					<div
						className="absolute left-1/2 top-1/2"
						style={{
							width: `${(element.width || 300) * scale}px`,
							height: `${(element.height || 220) * scale}px`,
							transform: `translate(-50%, -50%) scale(${1 / scale})`,
							transformOrigin: 'center',
						}}
					>
						<div className="flex h-full flex-col overflow-y-auto p-3">
						<div className="flex items-center justify-between gap-2">
							<p className="min-w-0 truncate text-sm font-bold text-[#053254]">
								{path.goalSummary || path.goal || 'Goal path'}
							</p>
							<button
								type="button"
								className="min-h-[32px] rounded px-2 text-lg font-bold text-[#053254] hover:bg-[#ECF4FA] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#1665c0]"
								onClick={() => onExpandedChange(false)}
								aria-label="Collapse goal path"
							>
								×
							</button>
						</div>
						<p className="mt-1 text-xs font-bold text-[#44546A]">
							{completedSteps.length} of {steps.length} done
						</p>
						{completionNotice && (
							<div className="mt-2 rounded bg-[#EAF6EF] px-2 py-1 text-xs font-bold text-[#1B7A43]" role="status">
								{completionNotice}
							</div>
						)}
						{activeStep ? (
							<>
								<div className="mt-2 flex items-center justify-between gap-2">
									<button
										type="button"
										className="min-h-[36px] min-w-[36px] rounded-full border border-[#D3D3D3] text-base font-bold text-[#053254] hover:bg-[#ECF4FA] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#1665c0] disabled:opacity-40"
										onClick={() =>
											cycleTo((activeIndex - 1 + activeSteps.length) % activeSteps.length, -1)
										}
										disabled={activeSteps.length < 2 || isCycling || isCompleting}
										aria-label="Previous goal step"
									>
										←
									</button>
									<p className="text-xs font-bold text-[#44546A]">
										Step {activeStep.order} of {steps.length}
									</p>
									<button
										type="button"
										className="min-h-[36px] min-w-[36px] rounded-full border border-[#D3D3D3] text-base font-bold text-[#053254] hover:bg-[#ECF4FA] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#1665c0] disabled:opacity-40"
										onClick={() => cycleTo((activeIndex + 1) % activeSteps.length, 1)}
										disabled={activeSteps.length < 2 || isCycling || isCompleting}
										aria-label="Next goal step"
									>
										→
									</button>
								</div>
								<button
									type="button"
									className={`mt-2 w-full rounded-lg border border-[#D3D3D3] bg-[#F8FBFD] p-3 text-left transition-all duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#1665c0] ${cardTransitionClass}`}
									onClick={() => cycleTo((activeIndex + 1) % activeSteps.length, 1)}
									onKeyDown={handleCardKeyDown}
									disabled={activeSteps.length < 2 || isCycling || isCompleting}
									aria-label={`${activeStep.title}. Step ${activeStep.order} of ${steps.length}. Use arrow keys to change steps.`}
								>
									<p className="text-sm font-bold text-[#053254]">{activeStep.title}</p>
									{activeStep.why && <p className="mt-1 text-xs text-[#111827]">{activeStep.why}</p>}
									{activeStep.resources?.length > 0 && (
										<ul className="mt-1 flex list-disc flex-col gap-0.5 pl-4 text-[11px] text-[#44546A]">
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
								</button>
								<button
									type="button"
									className="mt-2 min-h-[36px] w-full rounded-lg bg-[#1B7A43] px-2 text-xs font-bold text-white hover:bg-[#166535] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#053254] disabled:opacity-60"
									onClick={completeActiveStep}
									disabled={isCompleting}
								>
									✓ Mark step complete
								</button>
							</>
						) : (
							<p className="mt-3 rounded bg-[#EAF6EF] p-2 text-xs font-bold text-[#1B7A43]">
								All steps completed.
							</p>
						)}
						{completedSteps.length > 0 && (
							<div className="mt-2 border-t border-[#D3D3D3] pt-2">
								<p className="text-xs font-bold text-[#053254]">Completed steps</p>
								<ul className="mt-1 flex flex-col gap-1">
									{completedSteps.map((step) => (
										<li
											key={step.id}
											className="flex items-center justify-between gap-2 rounded bg-[#EAF6EF] px-2 py-1 text-xs text-[#1B7A43]"
										>
											<span className="line-through">{step.title}</span>
											<button
												type="button"
												className="min-h-[28px] rounded px-1 font-bold underline hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#1665c0]"
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
				</div>
			)}
		</div>
	);
};

PathStackPreview.propTypes = {
	element: PropTypes.shape({
		width: PropTypes.number,
		height: PropTypes.number,
		scale: PropTypes.number,
		rotation: PropTypes.number,
	}).isRequired,
	isExpanded: PropTypes.bool.isRequired,
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
	children: PropTypes.node.isRequired,
};

PathStackPreview.defaultProps = {
	onExpandedChange: () => {},
};

export default PathStackPreview;
