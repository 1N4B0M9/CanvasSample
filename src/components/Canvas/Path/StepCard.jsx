import React, { useState } from 'react';
import PropTypes from 'prop-types';
import ResourceChip from './ResourceChip';
import useSubSteps from '../Recommendations/useSubSteps';

/**
 * One step of the path: number, title, why, check-off, resources for the step,
 * inline assumption correction, and the "Ask about this step" sub-steps flow.
 */
const StepCard = ({ step, resources, grounding, done, onToggleDone, onCorrectAssumption, goalSummary }) => {
	const [askOpen, setAskOpen] = useState(false);
	const [askText, setAskText] = useState('');
	const [subSteps, setSubSteps] = useState(null);
	const { fetchSubSteps, loading: askLoading } = useSubSteps();

	const handleAsk = async () => {
		const result = await fetchSubSteps({
			goalText: goalSummary,
			stepText: `${step.title}. ${step.why}`,
			userQuery: askText || undefined,
		});
		if (result?.steps?.length) setSubSteps(result.steps);
	};

	return (
		<div className={`rounded-xl border border-[#D3D3D3] p-4 ${done ? 'bg-[#EAF6EF]' : 'bg-white'}`}>
			<div className="flex items-start gap-3">
				<span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-[#053254] text-[16px] font-bold text-white">
					{step.order}
				</span>
				<div className="min-w-0 flex-1">
					<h3
						className={`text-[18px] font-bold leading-6 text-[#053254] ${done ? 'line-through decoration-1 opacity-70' : ''}`}
					>
						{step.title}
					</h3>
					{step.why && <p className="mt-1 text-[16px] leading-[24px] text-[#111827]">{step.why}</p>}
				</div>
				<button
					type="button"
					onClick={() => onToggleDone(step.id)}
					aria-label={done ? `Mark "${step.title}" not done` : `Mark "${step.title}" done`}
					className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full border-2 text-[20px] transition-colors ${
						done
							? 'border-[#1B7A43] bg-[#1B7A43] text-white'
							: 'border-[#D3D3D3] bg-white text-transparent hover:border-[#1B7A43]'
					}`}
				>
					✓
				</button>
			</div>

			{step.assumption && (
				<div className="mt-3 flex flex-wrap items-center gap-2 rounded-[10px] bg-[#ECF4FA] px-3 py-2">
					<span className="text-[15px] leading-[22px] text-[#111827]">{step.assumption}</span>
					<button
						type="button"
						onClick={() => onCorrectAssumption(step.assumption)}
						className="min-h-[44px] text-[15px] font-bold text-[#1665c0] underline-offset-2 hover:underline"
					>
						That&apos;s not right — fix it
					</button>
				</div>
			)}

			{(resources?.length || grounding) && (
				<div className="mt-3">
					<p className="text-[15px] font-bold text-[#44546A]">Who can help:</p>
					{grounding && !resources?.length && (
						<p className="mt-1 animate-pulse text-[15px] text-[#44546A]">Finding people who can help…</p>
					)}
					<div className="mt-2 flex flex-col gap-2">
						{(resources ?? []).map((r) => (
							<ResourceChip key={`${step.id}-${r.name}`} resource={r} />
						))}
					</div>
				</div>
			)}

			<div className="mt-3">
				{!askOpen ? (
					<button
						type="button"
						onClick={() => setAskOpen(true)}
						className="min-h-[44px] text-[16px] font-bold text-[#1665c0] underline-offset-2 hover:underline"
					>
						Ask about this step ›
					</button>
				) : (
					<div className="rounded-[10px] bg-[#ECF4FA] p-3">
						{!subSteps ? (
							<>
								<label className="block text-[15px] font-bold text-[#053254]" htmlFor={`ask-${step.id}`}>
									What do you want to know?
									<input
										id={`ask-${step.id}`}
										type="text"
										value={askText}
										onChange={(e) => setAskText(e.target.value)}
										onKeyDown={(e) => e.key === 'Enter' && !askLoading && handleAsk()}
										placeholder="Or leave blank and we'll break it into smaller steps"
										className="mt-1 w-full rounded-[10px] border border-[#D3D3D3] px-3 py-2 text-[16px] font-normal focus:border-[#1665c0] focus:outline-none"
									/>
								</label>
								<div className="mt-2 flex gap-2">
									<button
										type="button"
										onClick={handleAsk}
										disabled={askLoading}
										className="min-h-[44px] rounded-[10px] bg-[#053254] px-4 text-[16px] font-bold text-white hover:bg-[#053254CC] disabled:opacity-60"
									>
										{askLoading ? 'One moment…' : 'Break it down'}
									</button>
									<button
										type="button"
										onClick={() => setAskOpen(false)}
										className="min-h-[44px] px-2 text-[16px] text-[#44546A] hover:underline"
									>
										Never mind
									</button>
								</div>
							</>
						) : (
							<ol className="flex flex-col gap-2">
								{subSteps.map((s) => (
									<li key={`${step.id}-sub-${s.order}`} className="text-[15px] leading-[22px] text-[#111827]">
										<span className="font-bold text-[#053254]">
											{s.order}. {s.title}
										</span>
										{s.detail && <span> — {s.detail}</span>}
									</li>
								))}
							</ol>
						)}
					</div>
				)}
			</div>
		</div>
	);
};

StepCard.propTypes = {
	step: PropTypes.shape({
		id: PropTypes.string.isRequired,
		order: PropTypes.number.isRequired,
		title: PropTypes.string.isRequired,
		why: PropTypes.string,
		assumption: PropTypes.string,
	}).isRequired,
	resources: PropTypes.arrayOf(PropTypes.shape({})),
	grounding: PropTypes.bool,
	done: PropTypes.bool,
	onToggleDone: PropTypes.func.isRequired,
	onCorrectAssumption: PropTypes.func.isRequired,
	goalSummary: PropTypes.string,
};

StepCard.defaultProps = {
	resources: null,
	grounding: false,
	done: false,
	goalSummary: '',
};

export default StepCard;
