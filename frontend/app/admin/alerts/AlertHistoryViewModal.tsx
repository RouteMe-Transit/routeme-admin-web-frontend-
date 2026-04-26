import { FaXmark } from "react-icons/fa6";
import { ALERT_LABEL_MAP } from "@/config/alertTypes";
import type { AlertHistoryItem } from "./types";

type AlertHistoryViewModalProps = {
    item: AlertHistoryItem | null;
    onClose: () => void;
};

export default function AlertHistoryViewModal({ item, onClose }: AlertHistoryViewModalProps) {
    if (!item) {
        return null;
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="relative mx-4 w-full max-w-xl rounded-lg bg-white p-6 shadow-lg">
                <button
                    type="button"
                    aria-label="Close history alert preview"
                    className="absolute right-4 top-4 rounded-full border border-red-500 p-1 text-xl text-red-500 hover:bg-red-500 hover:text-white"
                    onClick={onClose}
                >
                    <FaXmark />
                </button>

                <h3 className="mb-5 text-lg font-bold text-gray-800">Alert Details</h3>

                <div className="space-y-2 text-sm text-gray-700">
                    <p>
                        <strong>Title:</strong> {item.title}
                    </p>
                    <p>
                        <strong>Type:</strong> {ALERT_LABEL_MAP[item.type]}
                    </p>
                    <p>
                        <strong>Status:</strong> {item.status}
                    </p>
                    <p>
                        <strong>Target:</strong> {item.targetAudience}
                    </p>
                    <p>
                        <strong>Affected Route:</strong> {item.affectedRoute}
                    </p>
                    {item.scheduledAt && (
                        <p>
                            <strong>Scheduled for:</strong> {item.scheduledAt}
                        </p>
                    )}
                    <p>
                        <strong>Created:</strong> {item.timestamp}
                    </p>
                </div>

                <div className="mt-5 rounded-md bg-gray-100 p-4">
                    <p className="mb-1 text-xs font-semibold uppercase text-gray-500">Description</p>
                    <p className="whitespace-pre-wrap break-words text-sm text-gray-700">{item.description}</p>
                </div>
            </div>
        </div>
    );
}
