// This component renders a card for an individual alert history item in the admin interface. It displays the alert's title, type, status, target audience, affected route, and timestamps. It also includes a button to view the full alert details.
import { ALERT_LABEL_MAP, ALERT_STYLE_MAP } from "@/config/alertTypes";
import { IoEye } from "react-icons/io5";

import type { AlertHistoryItem } from "./types";

type AlertHistoryItemCardProps = {
    item: AlertHistoryItem;
    onView: (item: AlertHistoryItem) => void;
};

export default function AlertHistoryItemCard({ item, onView }: AlertHistoryItemCardProps) {
    return (
        <div className={`rounded-md border-l-4 p-3 shadow-sm ${ALERT_STYLE_MAP[item.type].cardClass}`}>
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-gray-800">{item.title}</p>
                    <p className="text-xs text-gray-500">{ALERT_LABEL_MAP[item.type]}</p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={() => onView(item)}
                        className="alert-history-view-button flex h-7 w-7 items-center justify-center rounded-full bg-blue-50 text-blue-600 transition hover:bg-blue-100"
                        aria-label="View full alert"
                        title="View full alert"
                    >
                        <IoEye size={16} />
                    </button>
                    <span
                        className={`shrink-0 rounded-full border px-2 py-1 text-xs font-semibold ${
                            item.status === "published"
                                ? "border-emerald-300 bg-emerald-100 text-emerald-700"
                                : "border-amber-300 bg-amber-100 text-amber-700"
                        }`}
                    >
                        {item.status}
                    </span>
                </div>
            </div>
            <p className="mt-2 text-xs text-gray-600">Target: {item.targetAudience}</p>
            <p className="mt-1 text-xs text-gray-600">Affected Route: {item.affectedRoute}</p>
            {item.scheduledAt && <p className="mt-1 text-xs text-gray-600">Scheduled for: {item.scheduledAt}</p>}
            <p className="mt-1 text-xs text-gray-500">{item.timestamp}</p>
        </div>
    );
}
