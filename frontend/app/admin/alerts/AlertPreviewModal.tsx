import { FaXmark } from "react-icons/fa6";

type AlertPreviewModalProps = {
    open: boolean;
    onClose: () => void;
    previewCardClass: string;
    selectedAlertLabel: string;
    affectedRoute: string;
    alertTitle: string;
    description: string;
    isPublicAlert: boolean;
    targetRoute: string;
};

export default function AlertPreviewModal({
    open,
    onClose,
    previewCardClass,
    selectedAlertLabel,
    affectedRoute,
    alertTitle,
    description,
    isPublicAlert,
    targetRoute,
}: AlertPreviewModalProps) {
    if (!open) {
        return null;
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="relative mx-4 max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-lg bg-white p-8 shadow-lg">
                <button
                    type="button"
                    aria-label="Close preview"
                    className="absolute right-4 top-4 rounded-full border border-red-500 p-1 text-2xl text-red-500 hover:bg-red-500 hover:text-white"
                    onClick={onClose}
                >
                    <FaXmark />
                </button>
                <h2 className="mb-6 text-xl font-bold">Alert Preview</h2>

                <div className="mb-6 space-y-4">
                    <div className={`rounded border-l-4 p-4 ${previewCardClass}`}>
                        <p className="break-words text-sm text-gray-600">
                            <strong>Alert Type:</strong> {selectedAlertLabel}
                        </p>
                        <p className="mt-2 break-words text-sm text-gray-600">
                            <strong>Affected Route/Bus:</strong> {affectedRoute || "N/A"}
                        </p>
                        <p className="mt-3 break-words text-base font-bold text-gray-700">{alertTitle || "(No title entered)"}</p>
                        <p className="mt-3 whitespace-pre-wrap break-words text-gray-700">{description || "(No description entered)"}</p>
                        <p className="mt-4 break-words text-sm text-gray-600">
                            <strong>Target Audience:</strong> {isPublicAlert ? "All Passengers" : targetRoute || "Not selected"}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
