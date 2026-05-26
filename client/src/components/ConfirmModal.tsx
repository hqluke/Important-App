import type { ReactNode } from "react";

const ConfirmModal = ({
    title,
    children,
    onConfirm,
    onCancel,
    confirmLabel = "Confirm",
    cancelLabel = "Cancel",
    confirming,
}: {
    title: string
    children: ReactNode
    onConfirm: () => void
    onCancel: () => void
    confirmLabel?: string
    cancelLabel?: string
    confirming?: boolean
}) => {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
            <div className="bg-surface-card rounded-lg p-6 max-w-lg w-full mx-4 shadow-xl flex flex-col max-h-[80vh]">
                <h3 className="text-lg font-semibold text-emphasis mb-4 shrink-0">
                    {title}
                </h3>
                <div className="min-h-0 flex-1 overflow-y-auto text-emphasis text-sm space-y-1 pr-3 mb-6">
                    {children}
                </div>
                <div className="flex justify-end gap-x-3 shrink-0">
                    <button
                        onClick={onCancel}
                        disabled={confirming}
                        className="text-muted hover:text-emphasis transition-colors p-2 px-4 rounded-md border border-border disabled:opacity-50"
                    >
                        {cancelLabel}
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={confirming}
                        className="bg-blue-500 text-white p-2 px-4 rounded-md hover:bg-blue-600 transition-colors disabled:opacity-50"
                    >
                        {confirming ? "Saving…" : confirmLabel}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmModal;
