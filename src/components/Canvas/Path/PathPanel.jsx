import React, { useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import usePlanStream from './usePlanStream';
import AskView from './AskView';
import IntakeView from './IntakeView';
import PlanView from './PlanView';
import CrisisView from './CrisisView';

/**
 * "My Path" — the single surface replacing FindResourcesModal, PathwayOverlay and
 * BoardResourcesSidebar. Full-height right panel on desktop, bottom sheet on mobile.
 * Owns the SSE connection via usePlanStream.
 */
const PathPanel = ({ open, prefillQuery, onClose, onPlaceOnBoard }) => {
	const {
		phase,
		intent,
		questions,
		steps,
		resourcesByStep,
		hotlines,
		error,
		ask,
		submitAnswers,
		skipIntake,
		sendCorrection,
		reset,
	} = usePlanStream();

	// A fresh prefill (from a "Build a path for this" pill) restarts the flow with that text
	const lastPrefillRef = useRef(null);
	useEffect(() => {
		if (open && prefillQuery && prefillQuery !== lastPrefillRef.current) {
			lastPrefillRef.current = prefillQuery;
			reset();
			ask(prefillQuery);
		}
	}, [open, prefillQuery, ask, reset]);

	if (!open) return null;

	const handleClose = () => {
		onClose();
	};

	const handlePlace = (planSteps, planResources) => {
		onPlaceOnBoard({ goalSummary: intent?.goalSummary ?? 'my goal', steps: planSteps, resourcesByStep: planResources });
	};

	return (
		<div
			className="fixed right-0 top-0 z-[60] flex h-full w-[380px] max-w-full flex-col bg-[#ECF4FA] shadow-2xl max-sm:inset-x-0 max-sm:bottom-0 max-sm:top-auto max-sm:h-[80%] max-sm:w-full max-sm:rounded-t-2xl"
			role="dialog"
			aria-label="My Path"
		>
			<div className="flex items-center justify-between border-b border-[#D3D3D3] bg-white px-5 py-3">
				<span className="text-[18px] font-bold text-[#053254]">My Path</span>
				<div className="flex items-center gap-1">
					{phase !== 'idle' && phase !== 'crisis' && (
						<button
							type="button"
							onClick={reset}
							className="min-h-[44px] px-3 text-[15px] font-bold text-[#1665c0] underline-offset-2 hover:underline"
						>
							Start over
						</button>
					)}
					<button
						type="button"
						onClick={handleClose}
						aria-label="Close My Path"
						className="flex h-11 w-11 items-center justify-center rounded-full text-[20px] text-[#053254] hover:bg-[#ECF4FA]"
					>
						✕
					</button>
				</div>
			</div>

			<div className="flex-1 overflow-y-auto">
				{phase === 'idle' && <AskView initialQuery={prefillQuery} onSubmit={ask} />}

				{phase === 'thinking' && (
					<div className="flex flex-col gap-3 p-5">
						<p className="animate-pulse text-[17px] leading-[26px] text-[#44546A]">Reading what you wrote…</p>
					</div>
				)}

				{phase === 'clarify' && <IntakeView questions={questions} onSubmit={submitAnswers} onSkip={skipIntake} />}

				{(phase === 'planning' || phase === 'done') && (
					<PlanView
						phase={phase}
						intent={intent}
						steps={steps}
						resourcesByStep={resourcesByStep}
						onCorrectAssumption={sendCorrection}
						onPlaceOnBoard={handlePlace}
					/>
				)}

				{phase === 'crisis' && <CrisisView hotlines={hotlines} />}

				{phase === 'error' && (
					<div className="flex flex-col gap-4 p-5">
						<p className="text-[17px] leading-[26px] text-[#111827]">{error}</p>
						<button
							type="button"
							onClick={reset}
							className="min-h-[48px] w-full rounded-[10px] bg-[#053254] text-[16px] font-bold text-white hover:bg-[#053254CC]"
						>
							Try again
						</button>
					</div>
				)}
			</div>
		</div>
	);
};

PathPanel.propTypes = {
	open: PropTypes.bool.isRequired,
	prefillQuery: PropTypes.string,
	onClose: PropTypes.func.isRequired,
	onPlaceOnBoard: PropTypes.func.isRequired,
};

PathPanel.defaultProps = {
	prefillQuery: '',
};

export default PathPanel;
