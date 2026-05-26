import { useState, useEffect, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import { Navigate } from "react-router-dom";
import {
    getScanResults,
    getScanStatus,
    saveSenders,
    streamScan,
} from "../api/scan";
import ConfirmModal from "./ConfirmModal";
import type { ScannedSender } from "../../types";

// TODO: replace with AI call
function categorizeByDomain(email: string): string | undefined {
    const domain = email.split("@").pop()?.toLowerCase() ?? "";
    if (
        /\b(bank|chase|wellsfargo|capitalone|amex|paypal|stripe|venmo|wise)\b/.test(
            domain,
        )
    )
        return "Financial";
    if (
        /\b(amazon|ebay|etsy|shopify|walmart|target|bestbuy|costco|alerts|tracking)\b/.test(
            domain,
        )
    )
        return "Shopping";
    if (
        /\b(linkedin|indeed|glassdoor|monster|workday|greenhouse|lever)\b/.test(
            domain,
        )
    )
        return "Employment";
    if (
        /\b(health|hospital|clinic|doctor|medicare|medicaid|aetna|cigna)\b/.test(
            domain,
        )
    )
        return "Healthcare";
    if (
        /\b(github|gitlab|vercel|aws|gcp|azure|docker|slack|notion|figma|railway)\b/.test(
            domain,
        )
    )
        return "Development";
    if (
        /\b(netflix|spotify|youtube|reddit|twitter|x\.com|discord)\b/.test(
            domain,
        )
    )
        return "Social";
    if (
        /\b(google|microsoft|apple|meta|facebook|zoom|teams|outlook)\b/.test(
            domain,
        )
    )
        return "Tech";
    return undefined;
}

const SCAN_COOLDOWN = 24 * 60 * 60 * 1000;

const phaseLabel: Record<string, string> = {
    listing: "Fetching email list…",
    fetching: "Fetching message details",
    sorting: "Sorting and categorizing…",
};

const EmailScanSetup = ({ onSaved }: { onSaved?: () => void }) => {
    const { user, gmailConnected, updateSendersSetup } = useAuth();
    const [window, setWindow] = useState("3m");
    const [error, setError] = useState("");
    const [grabbing, setGrabbing] = useState(false);
    const [senders, setSenders] = useState<ScannedSender[]>([]);
    const [saving, setSaving] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [scanStatus, setScanStatus] = useState<{
        phase: string;
        fetched: number;
        total: number;
    } | null>(null);
    const [pageLoaded, setPageLoaded] = useState(false);
    const [withinCooldown, setWithinCooldown] = useState(false);
    const [hoursLeft, setHoursLeft] = useState(0);
    const [minsLeft, setMinsLeft] = useState(0);
    const abortRef = useRef<AbortController | null>(null);

    // On mount, check cooldown and restore previous results
    useEffect(() => {
        if (!user) return;

        Promise.all([getScanResults(), getScanStatus()])
            .then(([results, status]) => {
                const cooldown =
                    !status.canScan &&
                    status.lastScanAt !== null &&
                    Date.now() - new Date(status.lastScanAt).getTime() <
                        SCAN_COOLDOWN;

                if (cooldown) {
                    const elapsed =
                        Date.now() - new Date(status.lastScanAt!).getTime();
                    const remaining = SCAN_COOLDOWN - elapsed;
                    setHoursLeft(Math.floor(remaining / 3_600_000));
                    setMinsLeft(Math.ceil((remaining % 3_600_000) / 60_000));
                }
                setWithinCooldown(cooldown);

                if (results.senders?.length) {
                    const mapped: ScannedSender[] = results.senders.map(
                        (s: { email: string; count: number }) => ({
                            email: s.email,
                            count: s.count,
                            isChecked: false,
                            category: categorizeByDomain(s.email),
                        }),
                    );
                    setSenders(mapped);
                }

                setPageLoaded(true);
            })
            .catch(() => {
                setPageLoaded(true);
            });
    }, [user]);

    if (!user || !gmailConnected) return <Navigate to="/" replace />;

    if (!pageLoaded) {
        return (
            <div className="max-w-2xl mx-auto text-center">
                <h2 className="text-4xl font-bold mb-2 text-emphasis">
                    Scan Emails
                </h2>
                <p className="text-muted mt-4">Loading…</p>
            </div>
        );
    }

    const handleGrabEmails = async () => {
        setGrabbing(true);
        setError("");
        setScanStatus({ phase: "listing", fetched: 0, total: 0 });
        setSenders([]);

        const abort = streamScan(window, {
            onStatus: (status) => {
                setScanStatus({
                    phase: status.phase,
                    fetched: status.fetched,
                    total: status.total,
                });
            },
            onComplete: (data) => {
                const mapped: ScannedSender[] = data.senders.map(
                    (s: { email: string; count: number }) => ({
                        email: s.email,
                        count: s.count,
                        isChecked: false,
                        category: categorizeByDomain(s.email),
                    }),
                );
                setSenders(mapped);
                setGrabbing(false);
                setScanStatus(null);
                setWithinCooldown(true);
                setHoursLeft(24);
                setMinsLeft(0);
            },
            onError: (msg) => {
                setError(msg);
                setGrabbing(false);
                setScanStatus(null);
            },
        });
        abortRef.current = abort;
    };

    const handleSaveConfirm = async () => {
        const selected = senders.filter((s) => s.isChecked);
        if (selected.length === 0) return;
        setSaving(true);
        try {
            await saveSenders(
                selected.map((s) => ({
                    email: s.email,
                    label: s.label,
                    category: s.category,
                })),
            );
            updateSendersSetup(true);
            setSenders([]);
            setShowConfirm(false);
            onSaved?.();
        } catch {
            setError("Failed to save senders.");
            setShowConfirm(false);
        } finally {
            setSaving(false);
        }
    };

    const selectedSenders = senders.filter((s) => s.isChecked);

    const toggleCheck = (email: string) => {
        setSenders((prev) =>
            prev.map((s) =>
                s.email === email ? { ...s, isChecked: !s.isChecked } : s,
            ),
        );
    };

    const toggleCategory = (category: string) => {
        setSenders((prev) => {
            const allChecked = prev
                .filter((s) => (s.category ?? "Uncategorized") === category)
                .every((s) => s.isChecked);
            return prev.map((s) =>
                (s.category ?? "Uncategorized") === category
                    ? { ...s, isChecked: !allChecked }
                    : s,
            );
        });
    };

    const setLabel = (email: string, label: string) => {
        setSenders((prev) =>
            prev.map((s) => (s.email === email ? { ...s, label } : s)),
        );
    };

    const grouped = senders.reduce<Record<string, ScannedSender[]>>(
        (acc, s) => {
            const key = s.category ?? "Uncategorized";
            if (!acc[key]) acc[key] = [];
            acc[key].push(s);
            return acc;
        },
        {},
    );

    return (
        <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-4xl font-bold mb-2 text-emphasis">
                Scan Emails
            </h2>
            <p className="text-muted text-m mb-6 max-w-1.1xl">
                Find frequent senders in your inbox. Labels you set will appear
                in notifications. <br></br> If no label is set, the sender's
                email will be shown instead.
            </p>

            {error && (
                <div className="bg-red-900/30 border border-red-700 text-red-400 p-3 rounded mb-4">
                    {error}
                </div>
            )}

            {/* Cooldown notice */}
            {withinCooldown && (
                <div className="border border-blue-500/30 bg-blue-500/10 rounded-lg py-3 mb-4 text-center">
                    <p className="text-blue-400 font-semibold">
                        You can scan again in {hoursLeft}h {minsLeft}m
                    </p>
                </div>
            )}

            {/* Info box */}
            <div className="bg-surface-card border border-border text-muted rounded-lg p-5 mb-6 text-center space-y-3 max-w-2xl mx-auto">
                <p className="leading-relaxed text-[1.1rem]">
                    Scanning is limited to once per day. You can look back{" "}
                    <span className="text-emphasis">1, 3, 6, or 12 months</span>
                    . Three months is the sweet spot for most users.
                </p>
                <p className="leading-relaxed text-[1.1rem]">
                    Scans run at roughly 1,000 emails every 20 seconds. Longer
                    windows take more time and mostly surface senders you hear
                    from less often.
                </p>
                <p className="leading-relaxed text-[1.05rem] font-bold">
                    We only read email headers (Sender, Subject, Date),{" "}
                    <span className="text-emphasis">never message content</span>
                    .
                </p>
            </div>

            {/* Scan controls — only show outside cooldown when no results exist */}
            {!withinCooldown && !grabbing && senders.length === 0 && (
                <div className="flex gap-x-4 items-end mb-6">
                    <div>
                        <label className="block text-sm text-muted mb-1">
                            Time window
                        </label>
                        <select
                            value={window}
                            onChange={(e) => setWindow(e.target.value)}
                            className="border border-border bg-surface-card text-emphasis p-2 rounded"
                        >
                            <option value="1m">1 month</option>
                            <option value="3m">3 months</option>
                            <option value="6m">6 months</option>
                            <option value="12m">1 year</option>
                        </select>
                    </div>
                    <button
                        className="bg-blue-500 text-white p-2 px-4 rounded-md hover:bg-blue-600 transition-colors"
                        onClick={handleGrabEmails}
                    >
                        Scan
                    </button>
                </div>
            )}

            {/* Progress during scan */}
            {grabbing && scanStatus && (
                <div className="mb-6 p-4 bg-surface-card rounded">
                    <p className="text-emphasis mb-2">
                        {phaseLabel[scanStatus.phase] ?? "Working…"}
                        {scanStatus.phase === "fetching" &&
                            scanStatus.total > 0 && (
                                <span className="text-muted">
                                    {" "}
                                    ({scanStatus.fetched} of {scanStatus.total})
                                </span>
                            )}
                    </p>
                    {scanStatus.total > 0 && (
                        <div className="w-full bg-surface-alt rounded-full h-2 overflow-hidden">
                            <div
                                className="bg-blue-500 h-full rounded-full transition-all duration-300"
                                style={{
                                    width: `${Math.min(100, (scanStatus.fetched / scanStatus.total) * 100)}%`,
                                }}
                            />
                        </div>
                    )}
                    <p className="text-muted text-xs mt-2">
                        This may take up to 30 seconds.
                    </p>
                </div>
            )}

            {/* Results grouped by category */}
            {senders.length > 0 &&
                Object.entries(grouped).map(([category, items]) => (
                    <div key={category} className="mb-6">
                        <div className="flex items-center gap-x-2 mb-2">
                            <h3 className="text-lg font-semibold text-emphasis">
                                {category}
                            </h3>
                            <button
                                onClick={() => toggleCategory(category)}
                                className="text-xs text-muted hover:text-emphasis transition-colors border border-border px-2 py-0.5 rounded"
                            >
                                Toggle all
                            </button>
                        </div>
                        <div className="space-y-2">
                            {items.map((s) => (
                                <div
                                    key={s.email}
                                    onClick={() => toggleCheck(s.email)}
                                    className="flex items-center gap-x-3 bg-surface-card p-3 rounded cursor-pointer hover:bg-surface-alt transition-colors"
                                >
                                    <input
                                        type="checkbox"
                                        checked={s.isChecked}
                                        readOnly
                                        className="accent-blue-500 pointer-events-none"
                                    />
                                    <span className="flex-1 text-emphasis truncate">
                                        {s.email}
                                    </span>
                                    <span className="text-muted text-sm w-12 text-right">
                                        {s.count}
                                    </span>
                                    <input
                                        type="text"
                                        placeholder="Label…"
                                        maxLength={20}
                                        value={s.label ?? ""}
                                        onClick={(e) => e.stopPropagation()}
                                        onChange={(e) =>
                                            setLabel(s.email, e.target.value)
                                        }
                                        className="border border-border bg-surface text-emphasis placeholder:text-subtle p-1 rounded text-sm w-36"
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                ))}

            {/* Save button */}
            {senders.length > 0 && (
                <button
                    className="bg-blue-500 text-white p-2 px-6 rounded-md hover:bg-blue-600 transition-colors disabled:opacity-50"
                    disabled={
                        saving ||
                        senders.filter((s) => s.isChecked).length === 0
                    }
                    onClick={() => setShowConfirm(true)}
                >
                    {saving
                        ? "Saving…"
                        : `Save Senders (${senders.filter((s) => s.isChecked).length})`}
                </button>
            )}

            {showConfirm && (
                <ConfirmModal
                    title="Confirm Senders"
                    confirmLabel="Confirm"
                    cancelLabel="Cancel"
                    confirming={saving}
                    onConfirm={handleSaveConfirm}
                    onCancel={() => setShowConfirm(false)}
                >
                    {selectedSenders.map((s) => (
                        <div
                            key={s.email}
                            className="flex justify-between py-0.5"
                        >
                            <span className="truncate">
                                {s.label ? `${s.label}: ${s.email}` : s.email}
                            </span>
                            <span className="text-muted shrink-0 ml-2">
                                {s.count}
                            </span>
                        </div>
                    ))}
                </ConfirmModal>
            )}
        </div>
    );
};

export default EmailScanSetup;
