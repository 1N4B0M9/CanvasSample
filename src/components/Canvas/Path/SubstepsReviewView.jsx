import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import useSubSteps from '../Recommendations/useSubSteps';

const SubstepsReviewView = ({ goal, path, step, onAdd, onClose }) => {
	const { fetchSubSteps, loading: apiLoading, error: apiError } = useSubSteps();
	const [result, setResult] = useState(null);

	useEffect(() => {
		let cancelled = false;

		const load = async () => {
			const response = await fetchSubSteps({
				goalText: goal || path.goalSummary || path.goal,
				stepText: `${step.title}. ${step.why || ''}`,
			});
			if (!cancelled && response) setResult(response);
		};

		load();
		return () => {
			cancelled = true;
		};
	}, [fetchSubSteps, goal, path.goal, path.goalSummary, step.id, step.title, step.why]);

	const handleAdd = () => {
		if (!result?.steps?.length) return;
		const hasCompletedSubsteps = step.subpath?.steps?.some((substep) => substep.done);
		if (
			hasCompletedSubsteps &&
			// eslint-disable-next-line no-alert
			!window.confirm('Regenerating these substeps will remove their completed state. Continue?')
		) {
			return;
		}

		const searchResults = result.searchResults ?? [];
		const resources = searchResults.map((source) => ({
			name: source.title,
			blurb: 'Source for this substep',
			phone: null,
			url: source.url,
			trust: 'web',
			verifiedAt: null,
			citations: [source],
		}));

		onAdd({
			version: 1,
			createdAt: new Date().toISOString(),
			goal: goal || path.goalSummary || path.goal,
			steps: result.steps.map((substep, index) => ({
				id: `${step.id}-sub-${substep.order ?? index + 1}`,
				order: index + 1,
				title: substep.title,
				why: substep.detail || '',
				detail: substep.detail || '',
				label: substep.label || null,
				resources,
				done: false,
				doneAt: null,
			})),
		});
	};

	return (
		<div className="flex flex-col gap-4 p-5">
			<div>
				<h2 className="text-[22px] font-bold leading-7 text-[#053254]">Break down this step</h2>
				<p className="mt-1 text-[15px] leading-[22px] text-[#44546A]">
					{goal || path.goalSummary || path.goal}
				</p>
				<div className="mt-3 rounded-xl border border-[#D3D3D3] bg-white p-3">
					<p className="text-[17px] font-bold text-[#053254]">{step.title}</p>
					{step.why && <p className="mt-1 text-[15px] leading-[22px] text-[#111827]">{step.why}</p>}
				</div>
			</div>

			{apiLoading && <p className="animate-pulse text-[16px] text-[#44546A]">Building smaller steps…</p>}
			{apiError && <p className="text-[15px] text-[#B3261E]">{apiError}</p>}
			{result?.steps?.length > 0 && (
				<>
					<ol className="flex flex-col gap-2">
						{result.steps.map((substep, index) => (
							<li key={`${step.id}-review-${substep.order ?? index + 1}`} className="rounded-xl border border-[#D3D3D3] bg-white p-3">
								<p className="text-[16px] font-bold text-[#053254]">
									{index + 1}. {substep.title}
								</p>
								{substep.detail && <p className="mt-1 text-[14px] leading-[20px] text-[#111827]">{substep.detail}</p>}
							</li>
						))}
					</ol>
					{result.searchResults?.length > 0 && (
						<p className="text-[13px] text-[#44546A]">
							{result.searchResults.length} source{result.searchResults.length === 1 ? '' : 's'} found
						</p>
					)}
					<button
						type="button"
						onClick={handleAdd}
						className="min-h-[48px] w-full rounded-[10px] bg-[#053254] text-[16px] font-bold text-white hover:bg-[#053254CC]"
					>
						Add these substeps to the card
					</button>
				</>
			)}
			<button
				type="button"
				onClick={onClose}
				className="min-h-[44px] text-[16px] font-bold text-[#1665c0] underline-offset-2 hover:underline"
			>
				Cancel
			</button>
		</div>
	);
};

SubstepsReviewView.propTypes = {
	goal: PropTypes.string,
	path: PropTypes.shape({
		goal: PropTypes.string,
		goalSummary: PropTypes.string,
	}).isRequired,
	step: PropTypes.shape({
		id: PropTypes.string.isRequired,
		title: PropTypes.string.isRequired,
		why: PropTypes.string,
		subpath: PropTypes.shape({
			steps: PropTypes.arrayOf(PropTypes.shape({ done: PropTypes.bool })),
		}),
	}).isRequired,
	onAdd: PropTypes.func.isRequired,
	onClose: PropTypes.func.isRequired,
};

SubstepsReviewView.defaultProps = {
	goal: '',
};

export default SubstepsReviewView;
