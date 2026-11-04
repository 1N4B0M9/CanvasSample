import React from 'react';
import PropTypes from 'prop-types';
import ResourceChip from './ResourceChip';

const SavedPathView = ({ path, onRegenerate }) => (
	<div className="flex flex-col gap-4 p-5">
		<div>
			<h2 className="text-[22px] font-bold leading-7 text-[#053254]">
				Your path: {path.goalSummary || path.goal || 'your goal'}
			</h2>
			<p className="mt-1 text-[15px] leading-[22px] text-[#44546A]">Saved on the board.</p>
		</div>

		<div className="flex flex-col gap-3">
			{path.steps.map((step) => (
				<div key={step.id} className="rounded-xl border border-[#D3D3D3] bg-white p-4">
					<h3 className="text-[18px] font-bold leading-6 text-[#053254]">
						{step.order}. {step.title}
					</h3>
					{step.why && <p className="mt-1 text-[16px] leading-[24px] text-[#111827]">{step.why}</p>}
					{step.resources?.length > 0 && (
						<div className="mt-3 flex flex-col gap-2">
							{step.resources.map((resource) => (
								<ResourceChip key={`${step.id}-${resource.name}`} resource={resource} />
							))}
						</div>
					)}
				</div>
			))}
		</div>

		<button
			type="button"
			onClick={onRegenerate}
			className="min-h-[48px] w-full rounded-[10px] border border-[#053254] bg-white text-[16px] font-bold text-[#053254] hover:bg-[#ECF4FA]"
		>
			Regenerate path
		</button>
	</div>
);

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
};

export default SavedPathView;
