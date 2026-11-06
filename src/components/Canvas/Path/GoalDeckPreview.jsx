import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import PathStackHint from './PathStackHint';
import { getPathPreviewOffset } from '../Utils/imageSizing';

/* eslint-disable jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions, jsx-a11y/no-noninteractive-tabindex */

const ANIMATION_MS = 220;

function getStepSources(step) {
	const sources = [];
	const seen = new Set();

	(step?.resources ?? []).forEach((resource) => {
		let citations = [];
		if (Array.isArray(resource.citations) && resource.citations.length > 0) citations = resource.citations;
		else if (resource.url) citations = [{ url: resource.url, title: resource.name }];

		citations.forEach((citation) => {
			if (!citation?.url || seen.has(citation.url)) return;
			seen.add(citation.url);
			sources.push(citation);
		});
	});

	return sources;
}

function getSubstepTransitionClass(animation) {
	if (animation === 'next') return 'translate-x-4 opacity-0';
	if (animation === 'previous') return '-translate-x-4 opacity-0';
	return 'translate-x-0 opacity-100';
}

const GoalDeckPreview = ({
	element,
	path,
	isExpanded,
	onExpandedChange,
	onUpdatePath,
	onOpenSubsteps,
	substepsFocusRequest,
	children,
}) => {
	const { scale = 1, rotation = 0 } = element;
	const { steps } = path;
	const activeSteps = steps;
	const activeIdsKey = activeSteps.map((step) => step.id).join('|');
	const [deckIds, setDeckIds] = useState(() => activeSteps.map((step) => step.id));
	const [animation, setAnimation] = useState(null);
	const [reducedMotion, setReducedMotion] = useState(false);
	const [contentFitScale, setContentFitScale] = useState(1);
	const [expandedSubstepId, setExpandedSubstepId] = useState(null);
	const [substepIndex, setSubstepIndex] = useState(0);
	const [substepAnimation, setSubstepAnimation] = useState(null);
	const rootRef = useRef(null);
	const contentRefs = useRef(new Map());
	const contentRefCallbacks = useRef(new Map());
	const animationTimeoutRef = useRef(null);

	const width = element.width || 300;
	const height = element.height || 220;
	const deckSteps = deckIds
		.map((id) => activeSteps.find((step) => step.id === id))
		.filter(Boolean);
	const activeStep = deckSteps[0] ?? null;
	const activeSubpath = activeStep?.subpath;
	const activeSubsteps = activeSubpath?.steps ?? [];
	const showingSubsteps = Boolean(activeStep && expandedSubstepId === activeStep.id && activeSubsteps.length);
	const activeSubstep = activeSubsteps[substepIndex] ?? activeSubsteps[0] ?? null;

	useEffect(() => {
		if (
			substepsFocusRequest?.elementId === element.id &&
			substepsFocusRequest.stepId
		) {
			setExpandedSubstepId(substepsFocusRequest.stepId);
			setSubstepIndex(0);
		}
	}, [element.id, substepsFocusRequest]);

	useEffect(() => {
		setExpandedSubstepId(null);
		setSubstepIndex(0);
	}, [activeStep?.id]);

	const getContentRef = (stepId) => {
		if (!contentRefCallbacks.current.has(stepId)) {
			contentRefCallbacks.current.set(stepId, (node) => {
				if (node) contentRefs.current.set(stepId, node);
				else contentRefs.current.delete(stepId);
			});
		}
		return contentRefCallbacks.current.get(stepId);
	};

	useLayoutEffect(() => {
		const nodes = [...contentRefs.current.values()];
		if (!nodes.length) return undefined;

		const measure = () => {
			const footprintScale = Math.min(width / 300, height / 220);
			const fitScale = nodes.reduce((smallest, node) => {
				if (!node.clientWidth || !node.clientHeight) return smallest;
				const widthScale = node.scrollWidth ? node.clientWidth / node.scrollWidth : 1;
				const heightScale = node.scrollHeight ? node.clientHeight / node.scrollHeight : 1;
				return Math.min(smallest, widthScale, heightScale);
			}, footprintScale);
			setContentFitScale((previous) => (Math.abs(previous - fitScale) < 0.001 ? previous : fitScale));
		};

		const observer = new ResizeObserver(measure);
		nodes.forEach((node) => observer.observe(node));
		measure();
		return () => observer.disconnect();
	}, [activeIdsKey, width, height]);

	useEffect(() => {
		setDeckIds((previous) => {
			const valid = previous.filter((id) => activeSteps.some((step) => step.id === id));
			const missing = activeSteps.map((step) => step.id).filter((id) => !valid.includes(id));
			return [...valid, ...missing];
		});
	}, [activeIdsKey]);

	useEffect(() => {
		const mediaQuery = window.matchMedia?.('(prefers-reduced-motion: reduce)');
		if (!mediaQuery) return undefined;
		const update = () => setReducedMotion(mediaQuery.matches);
		update();
		mediaQuery.addEventListener?.('change', update);
		return () => mediaQuery.removeEventListener?.('change', update);
	}, []);

	useEffect(
		() => () => {
			if (animationTimeoutRef.current) window.clearTimeout(animationTimeoutRef.current);
		},
		[],
	);

	useEffect(() => {
		if (!isExpanded) return undefined;

		const handleOutsidePointerDown = (event) => {
			if (
				event.target.closest?.(
					'[data-path-toggle="true"], [data-path-resize="true"], [data-path-panel="true"], [data-substeps-control="true"]',
				)
			)
				return;
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

	const finishAnimation = (direction) => {
		setDeckIds((previous) => {
			if (previous.length < 2) return previous;
			return direction > 0
				? [...previous.slice(1), previous[0]]
				: [previous[previous.length - 1], ...previous.slice(0, -1)];
		});
		setAnimation(null);
	};

	const cycleDeck = (direction) => {
		if (animation || deckSteps.length < 2) return;
		const duration = reducedMotion ? 0 : ANIMATION_MS;

		if (direction < 0 && duration > 0) {
			setAnimation('previous-enter');
			window.requestAnimationFrame(() => setAnimation('previous'));
		} else {
			setAnimation(direction > 0 ? 'next' : 'previous');
		}

		animationTimeoutRef.current = window.setTimeout(() => finishAnimation(direction), duration);
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

	const toggleActiveDone = () => {
		if (!activeStep || animation) return;
		if (activeStep.done) {
			updateStepDone(activeStep.id, false);
			return;
		}

		updateStepDone(activeStep.id, true);
	};

	const updateSubstepDone = (substepId, done) => {
		if (!activeStep?.subpath) return;
		onUpdatePath({
			...path,
			steps: steps.map((step) =>
				step.id === activeStep.id
					? {
							...step,
							subpath: {
								...step.subpath,
								steps: step.subpath.steps.map((substep) =>
									substep.id === substepId
										? {
												...substep,
												done,
												doneAt: done ? substep.doneAt || new Date().toISOString() : null,
											}
										: substep,
								),
							},
						}
					: step,
			),
		});
	};

	const cycleSubsteps = (direction) => {
		if (substepAnimation || activeSubsteps.length < 2) return;
		const nextIndex = (substepIndex + direction + activeSubsteps.length) % activeSubsteps.length;
		setSubstepAnimation(direction > 0 ? 'next' : 'previous');
		window.setTimeout(() => {
			setSubstepIndex(nextIndex);
			setSubstepAnimation(null);
		}, 180);
	};

	const handleSubstepKeyDown = (event) => {
		event.stopPropagation();
		if (event.key === 'ArrowRight') {
			event.preventDefault();
			cycleSubsteps(1);
		} else if (event.key === 'ArrowLeft') {
			event.preventDefault();
			cycleSubsteps(-1);
		}
	};

	const handleTopCardKeyDown = (event) => {
		if (event.key === 'ArrowRight') {
			event.preventDefault();
			cycleDeck(1);
		} else if (event.key === 'ArrowLeft') {
			event.preventDefault();
			cycleDeck(-1);
		} else if (event.key === 'Escape') {
			event.preventDefault();
			onExpandedChange(false);
		}
	};

	const renderSources = (step) => {
		const sources = getStepSources(step);
		if (!sources.length) return null;

		return (
			<div className="mt-2 flex w-fit items-center gap-1 border-t border-[#D3D3D3] pt-2">
				{sources.slice(0, 4).map((source) => {
					let host = null;
					try {
						host = new URL(source.url).host;
					} catch {
						host = null;
					}
					return (
						<a
							key={source.url}
							href={source.url}
							target="_blank"
							rel="noopener noreferrer"
							title={source.title || source.url}
							onClick={(event) => event.stopPropagation()}
							onMouseDown={(event) => event.stopPropagation()}
							className="flex h-7 w-7 items-center justify-center rounded-full border border-[#D3D3D3] bg-white shadow-sm hover:bg-[#ECF4FA]"
						>
							{host ? (
								<img
									src={`https://www.google.com/s2/favicons?domain=${host}&sz=32`}
									alt={host}
									className="h-4 w-4 rounded-sm"
								/>
							) : (
								<span className="text-xs">🔗</span>
							)}
						</a>
					);
				})}
			</div>
		);
	};

	const renderCardContent = (step, isTop, localRotation) => (
			<div
				ref={getContentRef(step.id)}
				className="relative flex h-full flex-col overflow-hidden p-3 pb-12"
				style={{
					transform: `rotate(${-localRotation}deg) scale(${contentFitScale})`,
					transformOrigin: 'center',
				}}
			>
				<div className="flex items-center justify-between gap-2">
					<p className="min-w-0 truncate text-sm font-bold text-[#053254]">
						{path.goalSummary || path.goal || 'Goal path'}
					</p>
					<button
						type="button"
						className={`flex h-8 w-8 items-center justify-center rounded-full border-2 text-base transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#1665c0] ${
							step.done
								? 'border-[#1B7A43] bg-[#1B7A43] text-white'
								: 'border-[#D3D3D3] bg-white text-transparent hover:border-[#1B7A43]'
						}`}
						onClick={toggleActiveDone}
						disabled={!isTop || Boolean(animation)}
						aria-label={step.done ? `Mark "${step.title}" not done` : `Mark "${step.title}" done`}
					>
						✓
					</button>
				</div>
				<p className="mt-1 text-xs font-bold text-[#44546A]">
					Step {step.order} of {steps.length}
				</p>
				{isTop && showingSubsteps && activeSubstep ? (
					<div
						className="mt-2 flex flex-1 flex-col"
						data-substeps-content="true"
						onClick={(event) => event.stopPropagation()}
						onMouseDown={(event) => event.stopPropagation()}
						onKeyDown={handleSubstepKeyDown}
					>
						<div
							className={`flex-1 transition-transform duration-200 ${getSubstepTransitionClass(substepAnimation)}`}
						>
							<div className="flex items-start justify-between gap-2">
								<div>
									<p className="text-sm font-bold text-[#053254]">{activeSubstep.title}</p>
									<p className="mt-1 text-xs text-[#111827]">{activeSubstep.why || activeSubstep.detail}</p>
								</div>
								<button
									type="button"
									className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full border-2 text-sm transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#1665c0] ${
										activeSubstep.done
											? 'border-[#1665c0] bg-[#1665c0] text-white'
											: 'border-[#1665c0] bg-white text-transparent hover:bg-[#ECF4FA]'
									}`}
									onClick={() => updateSubstepDone(activeSubstep.id, !activeSubstep.done)}
									aria-label={
										activeSubstep.done
											? `Mark "${activeSubstep.title}" not done`
											: `Mark "${activeSubstep.title}" done`
									}
									data-substeps-control="true"
								>
									✓
								</button>
							</div>
							{renderSources(activeSubstep)}
						</div>
						<div className="mt-2 flex items-center justify-between gap-2">
							<button
								type="button"
								className="min-h-[30px] min-w-[30px] rounded-full border border-[#1665c0] text-xs font-bold text-[#1665c0] hover:bg-[#ECF4FA] disabled:opacity-40"
								onClick={() => cycleSubsteps(-1)}
								disabled={activeSubsteps.length < 2 || Boolean(substepAnimation)}
								aria-label="Previous substep"
								data-substeps-control="true"
							>
								←
							</button>
							<span className="text-[11px] font-bold text-[#44546A]">
								Substep {substepIndex + 1} of {activeSubsteps.length}
							</span>
							<button
								type="button"
								className="min-h-[30px] min-w-[30px] rounded-full border border-[#1665c0] text-xs font-bold text-[#1665c0] hover:bg-[#ECF4FA] disabled:opacity-40"
								onClick={() => cycleSubsteps(1)}
								disabled={activeSubsteps.length < 2 || Boolean(substepAnimation)}
								aria-label="Next substep"
								data-substeps-control="true"
							>
								→
							</button>
						</div>
						<button
							type="button"
							className="mt-2 min-h-[28px] text-[11px] font-bold text-[#1665c0] underline"
							onClick={() => setExpandedSubstepId(null)}
							data-substeps-control="true"
						>
							Collapse substeps
						</button>
					</div>
				) : (
					<>
						<p className="mt-2 text-sm font-bold text-[#053254]">{step.title}</p>
						{step.why && <p className="mt-1 text-xs text-[#111827]">{step.why}</p>}
						{step.resources?.length > 0 && (
							<ul className="mt-1 flex list-disc flex-col gap-0.5 pl-4 text-[11px] text-[#44546A]">
								{step.resources.map((resource) => (
									<li key={`${step.id}-${resource.name}`}>
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
						<div className="absolute bottom-3 left-3 right-3 flex items-end justify-between gap-2 bg-white/95">
							<div className="min-w-0">{renderSources(step)}</div>
							{step.subpath ? (
								<button
									type="button"
									className="whitespace-nowrap text-[11px] font-bold text-[#1665c0] underline"
									onClick={() => {
										setExpandedSubstepId(step.id);
										setSubstepIndex(0);
									}}
									data-substeps-control="true"
									disabled={!isTop}
								>
									View substeps
								</button>
							) : (
								<button
									type="button"
									className="whitespace-nowrap rounded-full bg-[#053254] px-3 py-1 text-[11px] font-bold text-white shadow hover:bg-[#0a4a78]"
									onClick={() => onOpenSubsteps?.(step.id)}
									data-substeps-control="true"
									disabled={!isTop}
								>
									Build a path for this →
								</button>
							)}
						</div>
					</>
				)}
			</div>
		);

	const renderDeckCard = (step, depth) => {
		const isTop = depth === 0;
		const isPreviousIncoming = animation === 'previous' && depth === deckSteps.length - 1;
		const visualDepth = animation === 'next' && depth > 0 ? depth - 1 : depth;
		const offset = visualDepth === 0 ? 0 : getPathPreviewOffset(visualDepth, width, height, scale);
		let localRotation = 0;
		if (visualDepth > 0) localRotation = visualDepth % 2 === 0 ? -1 : 1;
		let x = offset;
		let y = -offset;
		let opacity = 1;
		let rotationOffset = localRotation;

		if (animation === 'next' && isTop) {
			x = width * 0.8;
			rotationOffset = 8;
			opacity = 0;
		} else if (animation === 'previous-enter' && depth === deckSteps.length - 1) {
			x = -width * 0.8;
			rotationOffset = -8;
			opacity = 0;
		} else if (animation === 'previous' && isPreviousIncoming) {
			x = 0;
			y = 0;
			rotationOffset = 0;
			opacity = 1;
		}

		const transitionClass =
			reducedMotion || animation === 'previous-enter' ? '' : 'transition-[transform,opacity] ease-out';
		const isPreviousCard = depth === deckSteps.length - 1 && (animation === 'previous-enter' || animation === 'previous');

		return (
			<div
				key={step.id}
				className={`absolute inset-0 overflow-hidden rounded-xl border border-[#D3D3D3] bg-white shadow-xl ${transitionClass}`}
				style={{
					zIndex: isPreviousCard ? deckSteps.length + 1 : deckSteps.length - depth,
					opacity,
					transitionDuration: reducedMotion ? '0ms' : `${ANIMATION_MS}ms`,
					pointerEvents: isTop ? 'auto' : 'none',
					transform: `translate(${x}px, ${y}px) rotate(${-rotation + rotationOffset}deg)`,
					transformOrigin: 'center',
				}}
				role={isTop ? 'button' : undefined}
				tabIndex={isTop ? 0 : undefined}
				onClick={(event) => {
					if (!isTop || event.target.closest?.('button,a,[data-substeps-content="true"]')) return;
					cycleDeck(1);
				}}
				onKeyDown={isTop ? handleTopCardKeyDown : undefined}
				aria-label={isTop ? `${step.title}. Use arrow keys to change steps.` : undefined}
			>
				<div
					className="absolute left-1/2 top-1/2"
					style={{
						width: `${width}px`,
						height: `${height}px`,
						transform: `translate(-50%, -50%) rotate(${-localRotation}deg)`,
						transformOrigin: 'center',
					}}
				>
					{renderCardContent(step, isTop, localRotation)}
				</div>
			</div>
		);
	};

	if (!steps.length) return null;

	return (
		<div
			ref={rootRef}
			className="relative text-left"
			style={{ width, height }}
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
				<PathStackHint cardCount={steps.length} width={width} height={height} scale={scale} />
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
				<div className="absolute inset-0">
					{deckSteps.map((step, depth) => renderDeckCard(step, depth))}
					{deckSteps.length > 1 && (
						<>
							<button
								type="button"
								className="absolute z-[60] flex h-9 w-9 items-center justify-center rounded-full border border-[#D3D3D3] bg-white text-base font-bold text-[#053254] shadow-md hover:bg-[#ECF4FA] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#1665c0] disabled:opacity-40"
								style={{
									left: `${-52 / scale}px`,
									top: '50%',
									transform: `translateY(-50%) rotate(${-rotation}deg) scale(${1 / scale})`,
									transformOrigin: 'center',
								}}
								onClick={() => cycleDeck(-1)}
								disabled={Boolean(animation)}
								aria-label="Previous goal step"
							>
								←
							</button>
							<button
								type="button"
								className="absolute z-[60] flex h-9 w-9 items-center justify-center rounded-full border border-[#D3D3D3] bg-white text-base font-bold text-[#053254] shadow-md hover:bg-[#ECF4FA] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#1665c0] disabled:opacity-40"
								style={{
									right: `${-52 / scale}px`,
									top: '50%',
									transform: `translateY(-50%) rotate(${-rotation}deg) scale(${1 / scale})`,
									transformOrigin: 'center',
								}}
								onClick={() => cycleDeck(1)}
								disabled={Boolean(animation)}
								aria-label="Next goal step"
							>
								→
							</button>
						</>
					)}
				</div>
			)}
		</div>
	);
};

GoalDeckPreview.propTypes = {
	element: PropTypes.shape({
		id: PropTypes.string,
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
				subpath: PropTypes.shape({
					steps: PropTypes.arrayOf(PropTypes.shape({})),
				}),
				resources: PropTypes.arrayOf(PropTypes.shape({})),
			}),
		).isRequired,
	}).isRequired,
	onExpandedChange: PropTypes.func,
	onUpdatePath: PropTypes.func.isRequired,
	onOpenSubsteps: PropTypes.func,
	substepsFocusRequest: PropTypes.shape({
		elementId: PropTypes.string,
		stepId: PropTypes.string,
	}),
	children: PropTypes.node.isRequired,
};

GoalDeckPreview.defaultProps = {
	onExpandedChange: () => {},
	onOpenSubsteps: () => {},
	substepsFocusRequest: null,
};

export default GoalDeckPreview;
