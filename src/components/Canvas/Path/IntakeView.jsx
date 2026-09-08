import React, { useState } from 'react';
import PropTypes from 'prop-types';

/**
 * Adaptive intake — the ≤3 questions the intent model picked for this goal.
 * Tappable chips only, whole step skippable in one tap, never quiz-like.
 */
const IntakeView = ({ questions, onSubmit, onSkip }) => {
	const [answers, setAnswers] = useState({});

	const pick = (questionId, option) => {
		setAnswers((prev) => ({ ...prev, [questionId]: prev[questionId] === option ? undefined : option }));
	};

	const answeredCount = Object.values(answers).filter(Boolean).length;

	return (
		<div className="flex flex-col gap-5 p-5">
			<p className="text-[17px] leading-[26px] text-[#111827]">
				A couple quick questions so your path fits you. <span className="text-[#44546A]">(Skip anytime)</span>
			</p>

			{questions.map((q) => (
				<div key={q.id}>
					<p className="text-[16px] font-bold leading-6 text-[#053254]">{q.text}</p>
					<div className="mt-2 flex flex-wrap gap-2">
						{q.options.map((option) => {
							const selected = answers[q.id] === option;
							return (
								<button
									key={option}
									type="button"
									onClick={() => pick(q.id, option)}
									className={`min-h-[44px] rounded-full px-4 text-[16px] font-bold transition-colors ${
										selected ? 'bg-[#053254] text-white' : 'bg-[#ECF4FA] text-[#053254] hover:bg-[#d9e9f5]'
									}`}
								>
									{option}
								</button>
							);
						})}
					</div>
				</div>
			))}

			<div className="flex flex-col gap-2">
				{answeredCount > 0 && (
					<button
						type="button"
						onClick={() => onSubmit(Object.fromEntries(Object.entries(answers).filter(([, v]) => v)))}
						className="min-h-[48px] w-full rounded-[10px] bg-[#053254] text-[16px] font-bold text-white hover:bg-[#053254CC]"
					>
						Build my path →
					</button>
				)}
				<button
					type="button"
					onClick={onSkip}
					className="min-h-[44px] text-[16px] font-bold text-[#1665c0] underline-offset-2 hover:underline"
				>
					Skip — just build my path →
				</button>
			</div>
		</div>
	);
};

IntakeView.propTypes = {
	questions: PropTypes.arrayOf(
		PropTypes.shape({
			id: PropTypes.string.isRequired,
			text: PropTypes.string.isRequired,
			options: PropTypes.arrayOf(PropTypes.string).isRequired,
		}),
	).isRequired,
	onSubmit: PropTypes.func.isRequired,
	onSkip: PropTypes.func.isRequired,
};

export default IntakeView;
