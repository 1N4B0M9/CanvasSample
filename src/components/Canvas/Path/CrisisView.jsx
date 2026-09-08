import React from 'react';
import PropTypes from 'prop-types';

/**
 * Crisis card — calm, no generated content, no decoration. Two huge call buttons
 * per hotline plus the existing Project Rebound help route.
 */
const CrisisView = ({ hotlines }) => (
	<div className="flex flex-col gap-4 p-5">
		<div className="rounded-xl bg-[#FDF2F2] p-4">
			<h2 className="text-[22px] font-bold leading-7 text-[#053254]">You don&apos;t have to handle this alone.</h2>
			<p className="mt-1 text-[17px] leading-[26px] text-[#111827]">
				These people are there right now, day or night. Calling is free and private.
			</p>
		</div>

		{hotlines.map((h) => (
			<div key={h.name} className="rounded-xl border border-[#D3D3D3] bg-white p-4">
				<p className="text-[18px] font-bold leading-6 text-[#053254]">{h.name}</p>
				{h.blurb && <p className="mt-1 text-[16px] leading-6 text-[#44546A]">{h.blurb}</p>}
				<div className="mt-3 flex flex-col gap-2">
					<a
						href={`tel:${h.phone.replace(/[^\d+]/g, '')}`}
						className="inline-flex min-h-[52px] items-center justify-center rounded-[10px] bg-[#053254] px-4 text-[18px] font-bold text-white hover:bg-[#053254CC]"
					>
						📞 Call {h.phone}
					</a>
					{h.sms && (
						<p className="text-center text-[15px] text-[#44546A]">{h.sms === h.phone ? `Or text ${h.sms}` : h.sms}</p>
					)}
				</div>
			</div>
		))}

		<a
			href="/help"
			className="inline-flex min-h-[48px] items-center justify-center rounded-[10px] border border-[#053254] bg-white px-4 text-[16px] font-bold text-[#053254] hover:bg-[#ECF4FA]"
		>
			Talk to someone at Project Rebound
		</a>
	</div>
);

CrisisView.propTypes = {
	hotlines: PropTypes.arrayOf(
		PropTypes.shape({
			name: PropTypes.string.isRequired,
			blurb: PropTypes.string,
			phone: PropTypes.string.isRequired,
			sms: PropTypes.string,
		}),
	).isRequired,
};

export default CrisisView;
