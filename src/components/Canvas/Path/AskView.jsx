import React, { useState } from 'react';
import PropTypes from 'prop-types';
import useVoiceInput from './useVoiceInput';

const EXAMPLE_CHIPS = ['I want a job', 'A place to live', 'Get my kids back', 'Go back to school'];

/**
 * "What do you want to work toward?" — free text in their own words,
 * example chips for the blank-page problem, optional voice input.
 */
const AskView = ({ initialQuery, onSubmit }) => {
	const [text, setText] = useState(initialQuery ?? '');
	const {
		supported: voiceSupported,
		listening,
		start: startVoice,
		stop: stopVoice,
	} = useVoiceInput((transcript) => setText((prev) => (prev ? `${prev} ${transcript}` : transcript)));

	const submit = () => {
		const query = text.trim();
		if (query) onSubmit(query);
	};

	return (
		<div className="flex flex-col gap-4 p-5">
			<div>
				<h2 className="text-[22px] font-bold leading-7 text-[#053254]">What do you want to work toward?</h2>
				<p className="mt-1 text-[16px] leading-6 text-[#44546A]">Say it in your own words.</p>
			</div>

			<div className="relative">
				<textarea
					value={text}
					onChange={(e) => setText(e.target.value)}
					onKeyDown={(e) => {
						if (e.key === 'Enter' && !e.shiftKey) {
							e.preventDefault();
							submit();
						}
					}}
					rows={3}
					placeholder="I want to become a teacher…"
					className="w-full resize-none rounded-xl border border-[#D3D3D3] p-3 pr-12 text-[17px] leading-[26px] text-[#111827] focus:border-[#1665c0] focus:outline-none"
				/>
				{voiceSupported && (
					<button
						type="button"
						onClick={listening ? stopVoice : startVoice}
						aria-label={listening ? 'Stop listening' : 'Say it out loud instead'}
						title={listening ? 'Stop listening' : 'Say it out loud instead'}
						className={`absolute bottom-3 right-2 flex h-11 w-11 items-center justify-center rounded-full text-[20px] transition-colors ${
							listening ? 'animate-pulse bg-[#B3261E] text-white' : 'bg-[#ECF4FA] text-[#053254] hover:bg-[#d9e9f5]'
						}`}
					>
						🎤
					</button>
				)}
			</div>

			<div className="flex flex-wrap gap-2">
				{EXAMPLE_CHIPS.map((chip) => (
					<button
						key={chip}
						type="button"
						onClick={() => onSubmit(chip)}
						className="min-h-[44px] rounded-full bg-[#ECF4FA] px-4 text-[16px] font-bold text-[#053254] hover:bg-[#d9e9f5]"
					>
						{chip}
					</button>
				))}
			</div>

			<button
				type="button"
				onClick={submit}
				disabled={!text.trim()}
				className="min-h-[48px] w-full rounded-[10px] bg-[#053254] text-[16px] font-bold text-white hover:bg-[#053254CC] disabled:opacity-50"
			>
				Build my path →
			</button>
		</div>
	);
};

AskView.propTypes = {
	initialQuery: PropTypes.string,
	onSubmit: PropTypes.func.isRequired,
};

AskView.defaultProps = {
	initialQuery: '',
};

export default AskView;
