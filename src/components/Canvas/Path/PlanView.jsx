import React, { useState } from 'react';
import PropTypes from 'prop-types';
import StepCard from './StepCard';

/**
 * The streaming plan: title in their words, steps appearing one by one,
 * check-off progress, and "Put this path on my board".
 */
const PlanView = ({ phase, intent, steps, resourcesByStep, onCorrectAssumption, onPlaceOnBoard }) => {
	const [doneSteps, setDoneSteps] = useState(() => new Set());

	const toggleDone = (stepId) => {
		setDoneSteps((prev) => {
			const next = new Set(prev);
			if (next.has(stepId)) next.delete(stepId);
			else next.add(stepId);
			return next;
		});
	};

	const streaming = phase === 'planning';
	const doneCount = steps.filter((s) => doneSteps.has(s.id)).length;

	return (
		<div className="flex flex-col gap-4 p-5">
			<div>
				<h2 className="text-[22px] font-bold leading-7 text-[#053254]">
					Your path: {intent?.goalSummary ?? 'your goal'}
				</h2>
				{steps.length > 0 && (
					<p className="mt-1 text-[15px] leading-[22px] text-[#44546A]">
						{doneCount > 0
							? `${doneCount} of ${steps.length} steps done`
							: `${steps.length} step${steps.length !== 1 ? 's' : ''}`}
						{doneCount > 0 && doneCount === steps.length ? ' — that took real work. 🎉' : ''}
					</p>
				)}
			</div>

			<div className="flex flex-col gap-3">
				{steps.map((step) => (
					<StepCard
						key={step.id}
						step={step}
						resources={resourcesByStep[step.id]}
						grounding={streaming || (phase === 'done' && !(step.id in resourcesByStep))}
						done={doneSteps.has(step.id)}
						onToggleDone={toggleDone}
						onCorrectAssumption={onCorrectAssumption}
						goalSummary={intent?.goalSummary}
					/>
				))}
			</div>

			{streaming && (
				<p className="animate-pulse text-[16px] leading-6 text-[#44546A]">
					{steps.length === 0 ? 'Building your path…' : 'Adding the next step…'}
				</p>
			)}

			{phase === 'done' && steps.length > 0 && (
				<button
					type="button"
					onClick={() => onPlaceOnBoard(steps, resourcesByStep)}
					className="min-h-[48px] w-full rounded-[10px] bg-[#053254] text-[16px] font-bold text-white hover:bg-[#053254CC]"
				>
					⊕ Put this path on my board
				</button>
			)}
		</div>
	);
};

PlanView.propTypes = {
	phase: PropTypes.string.isRequired,
	intent: PropTypes.shape({ goalSummary: PropTypes.string }),
	steps: PropTypes.arrayOf(PropTypes.shape({})).isRequired,
	resourcesByStep: PropTypes.objectOf(PropTypes.arrayOf(PropTypes.shape({}))).isRequired,
	onCorrectAssumption: PropTypes.func.isRequired,
	onPlaceOnBoard: PropTypes.func.isRequired,
};

PlanView.defaultProps = {
	intent: null,
};

export default PlanView;
