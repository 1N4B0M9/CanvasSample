import React, { useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import PathStackHint from './PathStackHint';

/* eslint-disable jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions */

const PathStackPreview = ({ element, path, onExpandedChange }) => {
	const { scale = 1, rotation = 0 } = element;
	const [isExpanded, setIsExpanded] = useState(false);
	const [activeIndex, setActiveIndex] = useState(0);
	const [cycleDirection, setCycleDirection] = useState(1);
	const [isCycling, setIsCycling] = useState(false);
	const rootRef = useRef(null);
	const cycleTimeoutRef = useRef(null);
	const { steps } = path;
	const activeStep = steps[activeIndex] ?? steps[0];

	const setExpanded = (expanded) => {
		setIsExpanded(expanded);
		onExpandedChange(expanded);
	};

	const cycleTo = (nextIndex, direction) => {
		if (isCycling || steps.length < 2) return;
		setCycleDirection(direction);
		setIsCycling(true);
		cycleTimeoutRef.current = window.setTimeout(() => {
			setActiveIndex(nextIndex);
			setIsCycling(false);
		}, 180);
	};

	useEffect(() => {
		setActiveIndex((index) => Math.min(index, Math.max(steps.length - 1, 0)));
	}, [path.createdAt, steps.length]);

	useEffect(
		() => () => {
			if (cycleTimeoutRef.current) window.clearTimeout(cycleTimeoutRef.current);
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
	}, [isExpanded]);

	if (!activeStep) return null;

	let cardTransitionClass = 'translate-x-0 opacity-100';
	if (isCycling) cardTransitionClass = cycleDirection > 0 ? 'translate-x-4 opacity-0' : '-translate-x-4 opacity-0';

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
								className="min-h-[36px] rounded px-2 text-lg font-bold text-[#053254] hover:bg-[#ECF4FA]"
								onClick={() => setExpanded(false)}
								aria-label="Collapse goal path"
							>
								×
							</button>
						</div>
						<div className="mt-3 flex items-center justify-between gap-2">
							<button
								type="button"
								className="min-h-[44px] min-w-[44px] rounded-full border border-[#D3D3D3] text-lg font-bold text-[#053254] hover:bg-[#ECF4FA] disabled:opacity-40"
								onClick={() => cycleTo((activeIndex - 1 + steps.length) % steps.length, -1)}
								disabled={steps.length < 2 || isCycling}
								aria-label="Previous goal step"
							>
								←
							</button>
							<p className="text-sm font-bold text-[#44546A]">
								Step {activeIndex + 1} of {steps.length}
							</p>
							<span className="w-[44px]" aria-hidden="true" />
						</div>
						<button
							type="button"
							className={`mt-3 w-full rounded-xl border border-[#D3D3D3] bg-[#F8FBFD] p-4 text-left shadow-sm transition-all duration-200 ${cardTransitionClass}`}
							onClick={() => cycleTo((activeIndex + 1) % steps.length, 1)}
							disabled={steps.length < 2 || isCycling}
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
				title: PropTypes.string.isRequired,
				why: PropTypes.string,
				resources: PropTypes.arrayOf(PropTypes.shape({})),
			}),
		).isRequired,
	}).isRequired,
	onExpandedChange: PropTypes.func,
};

PathStackPreview.defaultProps = {
	onExpandedChange: () => {},
};

export default PathStackPreview;
