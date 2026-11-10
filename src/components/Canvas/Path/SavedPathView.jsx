import React from 'react';
import PropTypes from 'prop-types';
import PlanView from './PlanView';

const SavedPathView = ({ path, onRegenerate, onUpdatePath }) => {
	const resourcesByStep = Object.fromEntries(path.steps.map((step) => [step.id, step.resources ?? []]));
	const initialDoneStepIds = path.steps.filter((step) => step.done).map((step) => step.id);

	const handleDoneStepsChange = (doneStepIds) => {
		const nextDoneIds = new Set(doneStepIds);
		onUpdatePath({
			...path,
			steps: path.steps.map((step) => ({
				...step,
				done: nextDoneIds.has(step.id),
				doneAt: nextDoneIds.has(step.id) ? step.doneAt || new Date().toISOString() : null,
			})),
		});
	};

	return (
		<>
			<PlanView
				phase="done"
				intent={{ goalSummary: path.goalSummary || path.goal }}
				steps={path.steps}
				resourcesByStep={resourcesByStep}
				onCorrectAssumption={() => {}}
				onPlaceOnBoard={() => {}}
				initialDoneStepIds={initialDoneStepIds}
				onDoneStepsChange={handleDoneStepsChange}
				showPlaceButton={false}
			/>
			<div className="px-5 pb-5">
				<button
					type="button"
					onClick={onRegenerate}
					className="min-h-[48px] w-full rounded-[10px] border border-[#053254] bg-white text-[16px] font-bold text-[#053254] hover:bg-[#ECF4FA]"
				>
					Regenerate path
				</button>
			</div>
		</>
	);
};

SavedPathView.propTypes = {
	path: PropTypes.shape({
		goal: PropTypes.string,
		goalSummary: PropTypes.string,
		steps: PropTypes.arrayOf(
			PropTypes.shape({
				id: PropTypes.string.isRequired,
				order: PropTypes.number.isRequired,
				title: PropTypes.string.isRequired,
				why: PropTypes.string,
				resources: PropTypes.arrayOf(PropTypes.shape({})),
			}),
		).isRequired,
	}).isRequired,
	onRegenerate: PropTypes.func.isRequired,
	onUpdatePath: PropTypes.func.isRequired,
};

export default SavedPathView;
