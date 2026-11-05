import React, { useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import PathStackHint from './PathStackHint';
import { getPathPreviewOffset } from '../Utils/imageSizing';

/* eslint-disable jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions, jsx-a11y/no-noninteractive-tabindex */

const ANIMATION_MS = 260;

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

const GoalDeckPreview = ({ element, path, isExpanded, onExpandedChange, onUpdatePath, children }) => {
	const { scale = 1, rotation = 0 } = element;
	const { steps } = path;
	const activeSteps = steps.filter((step) => !step.done);
	const completedSteps = steps.filter((step) => step.done);
	const activeIdsKey = activeSteps.map((step) => step.id).join('|');
	const [deckIds, setDeckIds] = useState(() => activeSteps.map((step) => step.id));
	const [animation, setAnimation] = useState(null);
	const [completionNotice, setCompletionNotice] = useState(null);
	const [reducedMotion, setReducedMotion] = useState(false);
	const rootRef = useRef(null);
	const animationTimeoutRef = useRef(null);
	const noticeTimeoutRef = useRef(null);

	const width = element.width || 300;
	const height = element.height || 220;
	const deckSteps = deckIds
		.map((id) => activeSteps.find((step) => step.id === id))
		.filter(Boolean);
	const activeStep = deckSteps[0] ?? null;

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
			if (noticeTimeoutRef.current) window.clearTimeout(noticeTimeoutRef.current);
		},
		[],
	);

	useEffect(() => {
		if (!isExpanded) return undefined;

		const handleOutsidePointerDown = (event) => {
			if (event.target.closest?.('[data-path-toggle="true"]')) return;
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

	const completeStep = () => {
		if (!activeStep || animation) return;
		const duration = reducedMotion ? 0 : ANIMATION_MS;
		setAnimation('complete');
		animationTimeoutRef.current = window.setTimeout(() => {
			updateStepDone(activeStep.id, true);
			setAnimation(null);
			setCompletionNotice(`Step completed · ${activeStep.title}`);
			if (noticeTimeoutRef.current) window.clearTimeout(noticeTimeoutRef.current);
			noticeTimeoutRef.current = window.setTimeout(() => setCompletionNotice(null), 3500);
		}, duration);
	};

	const undoStep = (stepId, title) => {
		updateStepDone(stepId, false);
		setCompletionNotice(`Undo · ${title}`);
		if (noticeTimeoutRef.current) window.clearTimeout(noticeTimeoutRef.current);
		noticeTimeoutRef.current = window.setTimeout(() => setCompletionNotice(null), 3500);
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
			<div className="mt-2 flex items-center gap-1 border-t border-[#D3D3D3] pt-2">
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

	const renderCardContent = (step, isTop) => (
		<div className="flex h-full flex-col overflow-y-auto p-3">
			<div className="flex items-center justify-between gap-2">
				<p className="min-w-0 truncate text-sm font-bold text-[#053254]">
					{isTop ? path.goalSummary || path.goal || 'Goal path' : `${step.order}. ${step.title}`}
				</p>
				{isTop && (
					<button
						type="button"
						className="min-h-[32px] rounded px-2 text-lg font-bold text-[#053254] hover:bg-[#ECF4FA] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#1665c0]"
						onClick={() => onExpandedChange(false)}
						aria-label="Collapse goal path"
					>
						×
					</button>
				)}
			</div>
			{isTop && (
				<p className="mt-1 text-xs font-bold text-[#44546A]">
					{completedSteps.length} of {steps.length} done
				</p>
			)}
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
			{isTop && (
				<>
					<div className="mt-2 flex items-center justify-between gap-2">
						<button
							type="button"
							className="min-h-[36px] min-w-[36px] rounded-full border border-[#D3D3D3] text-base font-bold text-[#053254] hover:bg-[#ECF4FA] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#1665c0] disabled:opacity-40"
							onClick={() => cycleDeck(-1)}
							disabled={deckSteps.length < 2 || Boolean(animation)}
							aria-label="Previous goal step"
						>
							←
						</button>
						<p className="text-xs font-bold text-[#44546A]">
							Step {step.order} of {steps.length}
						</p>
						<button
							type="button"
							className="min-h-[36px] min-w-[36px] rounded-full border border-[#D3D3D3] text-base font-bold text-[#053254] hover:bg-[#ECF4FA] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#1665c0] disabled:opacity-40"
							onClick={() => cycleDeck(1)}
							disabled={deckSteps.length < 2 || Boolean(animation)}
							aria-label="Next goal step"
						>
							→
						</button>
					</div>
					<button
						type="button"
						className="mt-2 min-h-[36px] w-full rounded-lg bg-[#1B7A43] px-2 text-xs font-bold text-white hover:bg-[#166535] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#053254] disabled:opacity-60"
						onClick={completeStep}
						disabled={Boolean(animation)}
					>
						✓ Mark step complete
					</button>
					{completionNotice && (
						<div className="mt-2 rounded bg-[#EAF6EF] px-2 py-1 text-xs font-bold text-[#1B7A43]" role="status">
							{completionNotice}
						</div>
					)}
					{completedSteps.length > 0 && (
						<div className="mt-2 border-t border-[#D3D3D3] pt-2">
							<p className="text-xs font-bold text-[#053254]">Completed steps</p>
							<ul className="mt-1 flex flex-col gap-1">
								{completedSteps.map((completed) => (
									<li
										key={completed.id}
										className="flex items-center justify-between gap-2 rounded bg-[#EAF6EF] px-2 py-1 text-xs text-[#1B7A43]"
									>
										<span className="line-through">{completed.title}</span>
										<button
											type="button"
											className="min-h-[28px] rounded px-1 font-bold underline hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#1665c0]"
											onClick={() => undoStep(completed.id, completed.title)}
										>
											Undo
										</button>
									</li>
								))}
							</ul>
						</div>
					)}
					{renderSources(step)}
				</>
			)}
		</div>
	);

	const renderDeckCard = (step, depth) => {
		const isTop = depth === 0;
		const isPreviousIncoming = animation === 'previous' && depth === deckSteps.length - 1;
		const offset = depth === 0 ? 0 : getPathPreviewOffset(depth, width, height, scale);
		let localRotation = 0;
		if (depth > 0) localRotation = depth % 2 === 0 ? -1 : 1;
		let x = offset;
		let y = -offset;
		let opacity = 1;
		let rotationOffset = localRotation;

		if (animation === 'next' && isTop) {
			x = width * 0.8;
			rotationOffset = 8;
			opacity = 0;
		} else if (animation === 'previous-enter' && isPreviousIncoming) {
			x = -width * 0.8;
			rotationOffset = -8;
			opacity = 0;
		} else if (animation === 'complete' && isTop) {
			y = height * 0.35;
			rotationOffset = 6;
			opacity = 0;
		}

		const transitionClass = reducedMotion || animation === 'previous-enter' ? '' : 'transition-[transform,opacity] duration-250 ease-out';

		return (
			<div
				key={step.id}
				className={`absolute inset-0 overflow-hidden rounded-xl border border-[#D3D3D3] bg-white shadow-xl ${transitionClass}`}
				style={{
					zIndex: deckSteps.length - depth,
					opacity,
					pointerEvents: isTop ? 'auto' : 'none',
					transform: `translate(${x}px, ${y}px) rotate(${-rotation + rotationOffset}deg)`,
					transformOrigin: 'center',
				}}
				role={isTop ? 'button' : undefined}
				tabIndex={isTop ? 0 : undefined}
				onClick={(event) => {
					if (!isTop || event.target.closest?.('button,a')) return;
					cycleDeck(1);
				}}
				onKeyDown={isTop ? handleTopCardKeyDown : undefined}
				aria-label={isTop ? `${step.title}. Use arrow keys to change steps.` : undefined}
			>
				<div
					className="absolute left-1/2 top-1/2"
					style={{
						width: `${width * scale}px`,
						height: `${height * scale}px`,
						transform: `translate(-50%, -50%) rotate(${-localRotation}deg) scale(${1 / scale})`,
						transformOrigin: 'center',
					}}
				>
					{renderCardContent(step, isTop)}
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
				</div>
			)}
		</div>
	);
};

GoalDeckPreview.propTypes = {
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

GoalDeckPreview.defaultProps = {
	onExpandedChange: () => {},
};

export default GoalDeckPreview;
