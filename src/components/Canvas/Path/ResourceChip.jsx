import React from 'react';
import PropTypes from 'prop-types';

/** Scheme-less sites ("ccac.edu") would resolve relative to the app; force an absolute https link. */
function toAbsoluteHref(raw) {
	if (!raw) return null;
	const value = String(raw).trim();
	if (!value) return null;
	if (/^https?:\/\//i.test(value)) return value;
	if (/^[a-z][a-z0-9+.-]*:/i.test(value)) return null; // mailto:, tel:, etc. are not websites
	return `https://${value.replace(/^\/+/, '')}`;
}

function formatVerifiedDate(iso) {
	if (!iso) return null;
	const date = new Date(iso);
	if (Number.isNaN(date.getTime())) return null;
	return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

/**
 * One org that can help with a step: name + trust badge, one plain sentence,
 * then Call before Website — both ≥44px touch targets.
 */
const ResourceChip = ({ resource }) => {
	const { name, blurb, phone, url, trust, verifiedAt, citations } = resource;
	const checkedDate = formatVerifiedDate(verifiedAt);
	const href = toAbsoluteHref(url);

	return (
		<div className="rounded-xl border border-[#D3D3D3] bg-white p-4 shadow-sm">
			<div className="flex flex-wrap items-start justify-between gap-2">
				<span className="text-[16px] font-bold leading-6 text-[#053254]">{name}</span>
				{trust === 'verified' ? (
					<span className="inline-flex items-center gap-1 rounded-full bg-[#EAF6EF] px-3 py-1 text-[13px] font-bold text-[#1B7A43]">
						✓ Verified by Project Rebound{checkedDate ? ` · checked ${checkedDate}` : ''}
					</span>
				) : (
					<span className="inline-flex items-center gap-1 rounded-full bg-[#FFF4DC] px-3 py-1 text-[13px] font-bold text-[#8A5A00]">
						🌐 Found online — call to confirm
					</span>
				)}
			</div>
			{blurb && <p className="mt-1 text-[15px] leading-[22px] text-[#44546A]">{blurb}</p>}
			<div className="mt-3 flex gap-2">
				{phone && (
					<a
						href={`tel:${phone.replace(/[^\d+]/g, '')}`}
						className="inline-flex min-h-[44px] flex-1 items-center justify-center gap-1 rounded-[10px] bg-[#053254] px-4 text-[16px] font-bold text-white hover:bg-[#053254CC]"
					>
						📞 Call {phone}
					</a>
				)}
				{href && (
					<a
						href={href}
						target="_blank"
						rel="noopener noreferrer"
						className="inline-flex min-h-[44px] items-center justify-center gap-1 rounded-[10px] border border-[#053254] bg-white px-4 text-[16px] font-bold text-[#053254] hover:bg-[#ECF4FA]"
					>
						🌐 Website
					</a>
				)}
			</div>
			{trust === 'web' && Array.isArray(citations) && citations.length > 0 && (
				<div className="mt-2 flex flex-wrap items-center gap-1.5">
					<span className="text-[13px] font-bold text-[#44546A]">Where we found this:</span>
					{citations.slice(0, 3).map((citation) => {
						let host = null;
						try {
							host = new URL(citation.url).host.replace(/^www\./, '');
						} catch {
							host = null;
						}
						return (
							<a
								key={citation.url}
								href={citation.url}
								target="_blank"
								rel="noopener noreferrer"
								title={citation.title || citation.url}
								className="inline-flex min-h-[28px] items-center gap-1 rounded-full border border-[#D3D3D3] bg-white px-2 py-0.5 text-[13px] text-[#1665c0] hover:bg-[#ECF4FA]"
							>
								{host ? (
									<img
										src={`https://www.google.com/s2/favicons?domain=${host}&sz=32`}
										alt=""
										className="h-3.5 w-3.5 rounded-sm"
									/>
								) : (
									<span className="text-xs">🔗</span>
								)}
								{host ?? 'source'}
							</a>
						);
					})}
				</div>
			)}
		</div>
	);
};

ResourceChip.propTypes = {
	resource: PropTypes.shape({
		name: PropTypes.string.isRequired,
		blurb: PropTypes.string,
		phone: PropTypes.string,
		url: PropTypes.string,
		trust: PropTypes.oneOf(['verified', 'web']).isRequired,
		verifiedAt: PropTypes.string,
		citations: PropTypes.arrayOf(PropTypes.shape({ url: PropTypes.string, title: PropTypes.string })),
	}).isRequired,
};

export default ResourceChip;
