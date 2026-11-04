import React from 'react';

const PathStackHint = () => (
	<div className="pointer-events-none absolute inset-0" aria-hidden="true">
		<div className="absolute inset-0 -translate-x-2 -translate-y-2 rounded border border-[#9BB8CC] bg-[#D9E9F5] shadow-sm" />
		<div className="absolute inset-0 translate-x-2 -translate-y-1 rounded border border-[#9BB8CC] bg-[#ECF4FA] shadow-sm" />
	</div>
);

export default PathStackHint;
