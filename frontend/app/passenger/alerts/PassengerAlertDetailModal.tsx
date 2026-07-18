//this file contains a React component that displays a modal with detailed information about a passenger alert. The modal shows the alert type, title, description, affected bus and route, and the time the alert was sent. It also handles loading and error states, and provides a close button to dismiss the modal.
"use client";

import { FaXmark } from "react-icons/fa6";
import { formatDetailTime, getAlertStyle, type PassengerAlertDetail } from "./alertHelpers";

type Props = {
	alert: PassengerAlertDetail | null;
	loading: boolean;
	error: string;
	onClose: () => void;
};

export default function PassengerAlertDetailModal({ alert, loading, error, onClose }: Props) {
	if (!loading && !error && !alert) {
		return null;
	}

	const { label, style, fullBorderClass } = getAlertStyle(alert?.alertType);

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm">
			<div className={`relative max-h-[90vh] w-full max-w-3xl overflow-auto rounded-[28px] shadow-2xl ${fullBorderClass}`}>
				<div className="px-5 py-5 pr-14 sm:pr-16">
					<div className="flex items-start justify-between gap-4">
						<div className="space-y-3">
							<div className="flex flex-wrap items-center gap-2">
								<span className={`rounded-full border px-3 py-1 text-[11px] font-semibold ${style.badgeClass}`}>{label}</span>
							</div>
							<h2 className="text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
								{loading ? "Loading..." : alert?.title ?? "Alert details"}
							</h2>
						</div>
					</div>
				</div>

				<div className="p-5 sm:p-6">
					{loading ? (
						<div className="rounded-2xl bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">Loading alert details...</div>
					) : error ? (
						<div className="rounded-2xl bg-rose-50 px-4 py-10 text-center text-sm text-rose-700">{error}</div>
					) : alert ? (
						<div className="space-y-4">
							<div className="grid gap-4 sm:grid-cols-2">
								<div>
									<p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">Affected Bus</p>
									<p className="mt-2 text-sm font-medium text-slate-800 wrap-break-word">{alert.affectedBus ?? "Not provided"}</p>
								</div>
								<div>
									<p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">Affected Route</p>
									<p className="mt-2 text-sm font-medium text-slate-800 wrap-break-word">{alert.affectedRoute ?? "Not provided"}</p>
								</div>
								<div>
									<p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">Sent At</p>
									<p className="mt-2 text-sm font-medium text-slate-800 wrap-break-word">{formatDetailTime(alert.sentAt)}</p>
								</div>
							</div>

							<div className="rounded-2xl bg-white px-4 py-4 shadow-sm sm:px-5">
								<p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">Description</p>
								<p className="mt-2 whitespace-pre-wrap text-base leading-7 text-slate-800 sm:text-[17px]">{alert.description ?? "Not provided"}</p>
							</div>
						</div>
					) : null}
				</div>

				<button
					type="button"
					onClick={onClose}
					className="fixed right-4 top-4 z-50 inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/95 text-rose-600 shadow-sm transition hover:bg-white hover:text-rose-700 sm:absolute sm:right-6 sm:top-6"
					aria-label="Close alert details"
				>
					<FaXmark className="text-lg" />
				</button>
			</div>
		</div>
	);
}