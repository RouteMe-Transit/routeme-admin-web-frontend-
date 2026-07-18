//this file contains a React component that displays a card for a passenger alert. The card shows the alert type, time, title, description, and affected route. It also indicates if the alert is unread. The component accepts props for the alert data and a callback function to handle opening the alert when the card is clicked.
"use client";

import { ALERT_LABEL_MAP, ALERT_STYLE_MAP } from "@/config/alertTypes";
import type { PassengerFeedAlert } from "./alertHelpers";
import { prefixTruncateWords } from "./alertHelpers";

type Props = {
	alert: PassengerFeedAlert;
	onOpen: (id: string) => void;
};

export default function PassengerAlertCard({ alert, onOpen }: Props) {
	const style = ALERT_STYLE_MAP[alert.type];

	return (
		<button
			type="button"
			onClick={() => onOpen(alert.id)}
			className={`w-full overflow-hidden rounded-md border-l-4 p-4 text-left shadow-sm transition hover:shadow-md ${style.cardClass}`}
		>
			<div className="mb-2 flex flex-wrap items-center justify-between gap-2">
				<span className={`rounded-full border px-2 py-1 text-xs font-semibold ${style.badgeClass}`}>
					{ALERT_LABEL_MAP[alert.type]}
				</span>
				<div className="flex items-center gap-2">
					{alert.isUnread && <span className="rounded-full bg-red-600 px-2 py-0.5 text-xs font-semibold text-white">New</span>}
					<span className="text-xs text-gray-500">{alert.time}</span>
				</div>
			</div>
			<h3 className="truncate text-base font-bold text-gray-800">{alert.title}</h3>
			<div className="mt-1 pr-2">
				<p className="wrap-break-word text-sm text-gray-700">{prefixTruncateWords(alert.description, 8)}</p>
			</div>
			<p className="mt-2 text-xs font-medium text-gray-600">Affected Route: {alert.affectedRoute}</p>
		</button>
	);
}