type AlertScheduleModalProps = {
    open: boolean;
    scheduleAt: string;
    onScheduleAtChange: (value: string) => void;
    onCancel: () => void;
    onConfirm: () => void;
};

export default function AlertScheduleModal({
    open,
    scheduleAt,
    onScheduleAtChange,
    onCancel,
    onConfirm,
}: AlertScheduleModalProps) {
    if (!open) {
        return null;
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="relative mx-4 w-full max-w-md rounded-lg bg-white p-6 shadow-lg">
                <h3 className="mb-4 text-lg font-bold">Schedule Alert</h3>
                <label className="mb-2 block text-sm font-semibold">Select Date and time</label>
                <input
                    type="datetime-local"
                    value={scheduleAt}
                    onChange={(e) => onScheduleAtChange(e.target.value)}
                    className="h-10 w-full rounded-md border border-[#828282] px-2"
                />
                <div className="mt-5 flex justify-end gap-3">
                    <button type="button" className="rounded-md bg-gray-500 px-4 py-2 text-white hover:bg-gray-600" onClick={onCancel}>
                        Cancel
                    </button>
                    <button
                        type="button"
                        disabled={scheduleAt.trim() === ""}
                        className="rounded-md bg-green-600 px-4 py-2 text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:bg-green-300"
                        onClick={onConfirm}
                    >
                        Confirm Schedule
                    </button>
                </div>
            </div>
        </div>
    );
}
