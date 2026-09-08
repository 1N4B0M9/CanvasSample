import React, { useCallback, useEffect, useState } from 'react';
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { auth, db } from '../../../firebase/firebase';

const WORKER_URL = process.env.REACT_APP_PATHWAY_WORKER_URL;

const VERIFY_BADGES = {
	checked: { label: '✓ Link checked', classes: 'bg-[#EAF6EF] text-[#1B7A43]' },
	dead: { label: 'Link not working', classes: 'bg-[#FDF2F2] text-[#B3261E]' },
	pending: { label: 'Not checked yet', classes: 'bg-[#FFF4DC] text-[#8A5A00]' },
};

/**
 * Admin review queue — the flywheel's human step.
 * Web-discovered orgs (verified in the background by the worker) wait here; approving one
 * copies it into the curated `resources` collection, so future paths show it as
 * "✓ Verified by Project Rebound" instead of "🌐 Found online".
 */
const ResourceManager = () => {
	const [suggestions, setSuggestions] = useState([]);
	const [unmetNeeds, setUnmetNeeds] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);
	const [busyId, setBusyId] = useState(null);

	const authedFetch = useCallback(async (path, options = {}) => {
		const token = await auth.currentUser.getIdToken();
		return fetch(`${WORKER_URL.replace(/\/$/, '')}${path}`, {
			...options,
			headers: { ...(options.headers ?? {}), Authorization: `Bearer ${token}` },
		});
	}, []);

	const load = useCallback(async () => {
		setLoading(true);
		setError(null);
		try {
			const res = await authedFetch('/suggestions');
			if (!res.ok) throw new Error(`Worker error: ${res.status}`);
			const data = await res.json();
			setSuggestions(data.suggestions ?? []);
			setUnmetNeeds(data.unmetNeeds ?? []);
		} catch (err) {
			setError(err.message || 'Could not load suggestions');
		} finally {
			setLoading(false);
		}
	}, [authedFetch]);

	useEffect(() => {
		load();
	}, [load]);

	const resolve = useCallback(
		async (suggestion, status) => {
			setBusyId(suggestion.id);
			try {
				if (status === 'approved') {
					// The promote write happens here in the browser, under the admin's own
					// Firestore permissions — the worker has no Firestore credentials.
					await addDoc(collection(db, 'resources'), {
						name: suggestion.name,
						description: suggestion.description ?? '',
						contact: suggestion.contact ?? {},
						goalTypes: suggestion.goalTypes ?? [],
						domains: [],
						citations: suggestion.citations ?? [],
						pathwaySteps: [],
						active: true,
						source: 'web-promoted',
						foundFor: suggestion.foundFor ?? null,
						lastVerified: Timestamp.now(),
					});
				}
				const res = await authedFetch('/suggestions/resolve', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ id: suggestion.id, status }),
				});
				if (!res.ok) throw new Error(`Worker error: ${res.status}`);
				setSuggestions((prev) => prev.filter((s) => s.id !== suggestion.id));
				if (status === 'approved') {
					// Best-effort: re-mirror the catalog so the next plan sees this org as verified right away
					// (otherwise it waits for the nightly cron). Failure here must not undo the approval.
					authedFetch('/catalog/sync', { method: 'POST' }).catch(() => {});
				}
			} catch (err) {
				setError(err.message || 'Something went wrong');
			} finally {
				setBusyId(null);
			}
		},
		[authedFetch],
	);

	return (
		<div className="mx-auto max-w-3xl px-5 py-8">
			<h1 className="text-[28px] font-bold leading-9 text-[#053254]">Suggested resources</h1>
			<p className="mt-1 text-[16px] leading-6 text-[#44546A]">
				Organizations found online while building people&apos;s paths. Approving one adds it to the trusted directory —
				future paths will show it as &ldquo;Verified by Project Rebound&rdquo;.
			</p>

			{error && (
				<div className="mt-4 rounded-xl bg-[#FDF2F2] p-4 text-[16px] text-[#B3261E]">
					{error}{' '}
					<button type="button" onClick={load} className="font-bold underline">
						Try again
					</button>
				</div>
			)}

			{loading ? (
				<p className="mt-6 animate-pulse text-[16px] text-[#44546A]">Loading suggestions…</p>
			) : (
				<div className="mt-6 flex flex-col gap-4">
					{suggestions.length === 0 && !error && (
						<p className="text-[16px] text-[#44546A]">Nothing waiting for review right now.</p>
					)}
					{suggestions.map((s) => (
						<div key={s.id} className="rounded-xl border border-[#D3D3D3] bg-white p-5 shadow-sm">
							<div className="flex flex-wrap items-start justify-between gap-2">
								<h2 className="text-[19px] font-bold leading-6 text-[#053254]">{s.name}</h2>
								<span
									className={`rounded-full px-3 py-1 text-[13px] font-bold ${(VERIFY_BADGES[s.verifyStatus] ?? VERIFY_BADGES.pending).classes}`}
								>
									{(VERIFY_BADGES[s.verifyStatus] ?? VERIFY_BADGES.pending).label}
								</span>
							</div>
							{s.description && <p className="mt-1 text-[16px] leading-6 text-[#111827]">{s.description}</p>}
							<div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[15px] text-[#44546A]">
								{s.contact?.phone && <span>📞 {s.contact.phone}</span>}
								{s.contact?.url && (
									<a
										href={s.contact.url}
										target="_blank"
										rel="noopener noreferrer"
										className="text-[#1665c0] underline-offset-2 hover:underline"
									>
										{s.contact.url}
									</a>
								)}
							</div>
							{s.foundFor && (
								<p className="mt-2 text-[14px] text-[#44546A]">
									Found while helping with: <span className="font-bold">{s.foundFor}</span>
								</p>
							)}
							{(s.goalTypes ?? []).length > 0 && (
								<div className="mt-2 flex flex-wrap gap-1">
									{s.goalTypes.map((g) => (
										<span key={g} className="rounded-full bg-[#ECF4FA] px-2 py-0.5 text-[13px] text-[#053254]">
											{g.replace(/_/g, ' ')}
										</span>
									))}
								</div>
							)}
							{(s.citations ?? []).length > 0 && (
								<div className="mt-2 flex flex-wrap items-center gap-2 text-[13px]">
									<span className="font-bold text-[#44546A]">Sources:</span>
									{s.citations.slice(0, 3).map((c) => (
										<a
											key={c.url}
											href={c.url}
											target="_blank"
											rel="noopener noreferrer"
											className="text-[#1665c0] underline-offset-2 hover:underline"
										>
											{c.title || c.url}
										</a>
									))}
								</div>
							)}
							<div className="mt-4 flex gap-2">
								<button
									type="button"
									disabled={busyId === s.id}
									onClick={() => resolve(s, 'approved')}
									className="min-h-[44px] rounded-[10px] bg-[#053254] px-5 text-[16px] font-bold text-white hover:bg-[#053254CC] disabled:opacity-60"
								>
									✓ Approve — add to directory
								</button>
								<button
									type="button"
									disabled={busyId === s.id}
									onClick={() => resolve(s, 'rejected')}
									className="min-h-[44px] rounded-[10px] border border-[#053254] bg-white px-5 text-[16px] font-bold text-[#053254] hover:bg-[#ECF4FA] disabled:opacity-60"
								>
									Reject
								</button>
							</div>
						</div>
					))}
				</div>
			)}

			<h2 className="mt-10 text-[22px] font-bold leading-7 text-[#053254]">
				What people needed but we couldn&apos;t cover
			</h2>
			<p className="mt-1 text-[15px] leading-[22px] text-[#44546A]">
				Steps where no trusted organization matched — a to-do list for what to curate next.
			</p>
			<div className="mt-3 flex flex-col gap-1">
				{unmetNeeds.length === 0 && <p className="text-[15px] text-[#44546A]">Nothing logged yet.</p>}
				{unmetNeeds.slice(0, 40).map((n) => (
					<div
						key={`${n.need}-${n.at}`}
						className="flex flex-wrap gap-x-3 border-b border-[#ECF4FA] py-1.5 text-[15px]"
					>
						<span className="font-bold text-[#111827]">{n.need}</span>
						<span className="text-[#44546A]">for &ldquo;{n.goal}&rdquo;</span>
						<span className="ml-auto text-[13px] text-[#44546A]">{new Date(n.at).toLocaleDateString()}</span>
					</div>
				))}
			</div>
		</div>
	);
};

export default ResourceManager;
