import React from 'react';
import PropTypes from 'prop-types';
import { getPathPreviewOffset } from '../Utils/imageSizing';

const PathStackHint = ({ cardCount, width, height, scale }) => {
	const visibleCount = Math.min(3, cardCount);

	return (
		<div className="pointer-events-none absolute inset-0" aria-hidden="true">
			{Array.from({ length: visibleCount }, (_, index) => {
				const depth = visibleCount - index;
				const offset = getPathPreviewOffset(depth, width, height, scale);

				return (
					<div
						key={depth}
						className="absolute inset-0 rounded border border-[#9BB8CC] shadow-sm"
						style={{
							transform: `translate(${offset}px, ${-offset}px)`,
							zIndex: index,
							backgroundColor: index % 2 === 0 ? '#D9E9F5' : '#ECF4FA',
						}}
					/>
				);
			})}
		</div>
	);
};

PathStackHint.propTypes = {
	cardCount: PropTypes.number.isRequired,
	width: PropTypes.number.isRequired,
	height: PropTypes.number.isRequired,
	scale: PropTypes.number.isRequired,
};

export default PathStackHint;
