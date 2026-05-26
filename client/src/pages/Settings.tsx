import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { deleteAllSenders } from "../api/senders";
import { deleteAllKeywords } from "../api/keywords";
import api from "../api/client";

const SettingsPage = () => {
    const {
        gmailConnected,
        logoutGmail,
        updateSendersSetup,
        updateKeywordsSetup,
    } = useAuth();
    const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
    const [pending, setPending] = useState("");

    const act = async (label: string, fn: () => Promise<unknown>) => {
        setPending(label);
        setMsg(null);
        try {
            await fn();
            setMsg({ ok: true, text: `${label} — done.` });
        } catch {
            setMsg({ ok: false, text: `${label} — failed.` });
        } finally {
            setPending("");
        }
    };

    const actions = [
        {
            label: "Clear scanned results",
            desc: "Deletes all scanned sender results and resets the 24-hour scan cooldown so you can scan again immediately.",
            action: async () => {
                await api.delete("/scan/reset");
            },
        },
        {
            label: "Delete all important senders",
            desc: "Removes every sender from your important list. Notifications for those senders will stop.",
            action: async () => {
                await deleteAllSenders();
                updateSendersSetup(false);
            },
        },
        {
            label: "Delete all keywords",
            desc: "Removes every keyword. Subject-matched notifications for those keywords will stop.",
            action: async () => {
                await deleteAllKeywords();
                updateKeywordsSetup(false);
            },
        },
        ...(gmailConnected
            ? [
                  {
                      label: "Disconnect Gmail",
                      desc: "Revokes Gmail access and deletes your stored tokens. You'll need to re-link your Gmail account to use scanning.",
                      action: logoutGmail as () => Promise<unknown>,
                  },
              ]
            : []),
    ];

    return (
        <div className="max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold mb-2 text-emphasis">Settings</h2>
            <p className="text-muted text-sm mb-6">
                Manage your account data and connections.
            </p>

            {msg && (
                <div
                    className={`p-3 rounded mb-4 text-sm ${msg.ok ? "bg-green-900/30 border border-green-700 text-green-400" : "bg-red-900/30 border border-red-700 text-red-400"}`}
                >
                    {msg.text}
                </div>
            )}

            <div className="space-y-3">
                {actions.map((a) => (
                    <ActionButton
                        key={a.label}
                        label={a.label}
                        description={a.desc}
                        pending={pending === a.label}
                        onClick={() => act(a.label, a.action)}
                    />
                ))}
            </div>
        </div>
    );
};

const ActionButton = ({
    label,
    description,
    pending,
    onClick,
}: {
    label: string;
    description: string;
    pending: boolean;
    onClick: () => void;
}) => (
    <div className="group relative">
        <button
            onClick={onClick}
            disabled={pending}
            className="w-full text-left bg-surface-card hover:bg-surface-alt disabled:opacity-50 text-emphasis p-3 rounded border border-border transition-colors"
        >
            {pending ? "Working…" : label}
        </button>
        <div className="absolute left-0 top-full mt-1 z-10 w-72 bg-surface-alt text-muted text-xs p-2 rounded border border-border opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
            {description}
        </div>
    </div>
);

export default SettingsPage;
