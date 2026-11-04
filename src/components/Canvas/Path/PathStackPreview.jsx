import React from 'react';
import PropTypes from 'prop-types';

const PathStackPreview = ({ element, path }) => {
	const scale = element.scale || 1;
	const rotation = element.rotation || 0;

	return (
		// eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions
		<div
			className="absolute left-0 top-full z-10 mt-2 w-[300px] rounded-lg border border-[#D3D3D3] bg-white p-3 text-left shadow-lg"
			style={{
				transform: `rotate(${-rotation}deg) scale(${1 / scale})`,
				transformOrigin: 'top left',
			}}
			onMouseDown={(event) => event.stopPropagation()}
			onClick={(event) => event.stopPropagation()}
			draggable={false}
			data-path-preview="true"
		>
			<p className="text-sm font-bold text-[#053254]">
				{path.goalSummary || path.goal || 'Goal path'}
			</p>
			<ol className="mt-2 flex list-decimal flex-col gap-2 pl-5 text-sm text-[#111827]">
				{path.steps.map((step) => (
					<li key={step.id}>
						<p className="font-bold">{step.title}</p>
						{step.why && <p>{step.why}</p>}
						{step.resources?.length > 0 && (
							<ul className="mt-1 list-disc pl-4 text-xs text-[#44546A]">
								{step.resources.map((resource) => (
									<li key={`${step.id}-${resource.name}`}>
										{resource.name}
										{resource.phone ? ` — ${resource.phone}` : ''}
										{resource.url && (
											<a
												className="ml-1 text-[#1665c0] underline"
												href={resource.url}
												target="_blank"
												rel="noopener noreferrer"
												onMouseDown={(event) => event.stopPropagation()}
												onClick={(event) => event.stopPropagation()}
											>
												Website
											</a>
										)}
									</li>
								))}
							</ul>
						)}
					</li>
				))}
			</ol>
		</div>
	);
};

PathStackPreview.propTypes = {
	element: PropTypes.shape({
		scale: PropTypes.number,
		rotation: PropTypes.number,
	}).isRequired,
	path: PropTypes.shape({
		goal: PropTypes.string,
		goalSummary: PropTypes.string,
		steps: PropTypes.arrayOf(
			PropTypes.shape({
				id: PropTypes.string.isRequired,
				title: PropTypes.string.isRequired,
				why: PropTypes.string,
				resources: PropTypes.arrayOf(PropTypes.shape({})),
			}),
		).isRequired,
	}).isRequired,
};

export default PathStackPreview;
