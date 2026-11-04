import React from 'react';
import PropTypes from 'prop-types';

const PathStackHint = ({ stepCount, onExpand }) => (
	<button
		type="button"
		className="relative mt-2 flex min-h-[44px] w-[170px] items-center justify-center rounded-lg border border-[#9BB8CC] bg-white px-3 text-sm font-bold text-[#053254] shadow-md transition hover:-translate-y-0.5 hover:shadow-lg"
		onClick={(event) => {
			event.stopPropagation();
			onExpand();
		}}
		onMouseDown={(event) => event.stopPropagation()}
		aria-label={`Show ${stepCount} goal path steps`}
	>
		<span className="absolute -top-1 left-2 h-2 w-[calc(100%-1rem)] -translate-y-1 rounded-t border border-[#9BB8CC] bg-[#ECF4FA]" />
		<span className="relative">✨ {stepCount} path steps</span>
	</button>
);

PathStackHint.propTypes = {
	stepCount: PropTypes.number.isRequired,
	onExpand: PropTypes.func.isRequired,
};

export default PathStackHint;
