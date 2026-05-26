import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getScanStatus } from "../api/scan";

function timeRemaining(lastScanAt: string): string {
    const diff = Date.now() - new Date(lastScanAt).getTime();
    const remaining = 24 * 60 * 60 * 1000 - diff;
    if (remaining <= 0) return "";
    const hours = Math.floor(remaining / 3_600_000);
    const mins = Math.ceil((remaining % 3_600_000) / 60_000);
    return `${hours}h ${mins}m`;
}

function Home() {
    const {
        user,
        error,
        gmailConnected,
        gmailLoading,
        sendersSetup,
        keywordsSetup,
    } = useAuth();

    const [scanStatus, setScanStatus] = useState<{
        canScan: boolean;
        lastScanAt: string | null;
        loaded: boolean;
    }>({ canScan: true, lastScanAt: null, loaded: false });

    useEffect(() => {
        if (!user || !gmailConnected) return;
        getScanStatus()
            .then((data) => setScanStatus({ ...data, loaded: true }))
            .catch(() =>
                setScanStatus({
                    canScan: true,
                    lastScanAt: null,
                    loaded: true,
                }),
            );
    }, [user, gmailConnected]);

    return (
        <div className="min-h-[80vh] flex items-center justify-center p-4">
            <div className="bg-surface-card p-8 rounded-lg shadow-md w-full max-w-lg text-center">
                {error && <p className="text-red-500">{error}</p>}
                {user ? (
                    gmailLoading ? (
                        <div>
                            <h2 className="text-2xl font-bold mb-4 text-emphasis">
                                Welcome, {user.email}!
                            </h2>
                        </div>
                    ) : gmailConnected ? (
                        <div>
                            <div>
                                <h2 className="text-2xl font-bold mb-4 text-emphasis">
                                    Senders and Keywords
                                </h2>
                            </div>

                            {/* Only show scan limits to users who have completed setup */}
                            {sendersSetup &&
                                keywordsSetup &&
                                scanStatus.loaded &&
                                !scanStatus.canScan && (
                                    <div className="border border-blue-500/30 bg-blue-500/10 rounded-lg py-3 px-4 mb-4 text-center">
                                        <p className="text-blue-400 font-semibold">
                                            You can scan again in{" "}
                                            {timeRemaining(
                                                scanStatus.lastScanAt!,
                                            )}
                                        </p>
                                        <p className="text-muted text-sm mt-1">
                                            Scanning is limited to once per day.
                                        </p>
                                    </div>
                                )}

                            <div className="flex gap-x-4">
                                {!sendersSetup ? (
                                    <Link
                                        to="/setup"
                                        className="w-full text-white bg-blue-500 p-3 rounded-md hover:bg-blue-600 font-medium"
                                    >
                                        Setup
                                    </Link>
                                ) : !keywordsSetup ? (
                                    <Link
                                        to="/setup"
                                        className="w-full text-white bg-blue-500 p-3 rounded-md hover:bg-blue-600 font-medium"
                                    >
                                        Continue Setup
                                    </Link>
                                ) : (
                                    <Link
                                        to="/settings/senders-and-keywords"
                                        className="w-full text-white bg-blue-500 p-3 rounded-md hover:bg-blue-600 font-medium"
                                    >
                                        Settings
                                    </Link>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div>
                            <h2 className="text-2xl font-bold mb-6 text-emphasis">
                                Please link your Gmail account.
                            </h2>
                            <div className="flex flex-col gap-y-4">
                                <Link
                                    to="/gmail/link"
                                    className="w-full text-white bg-blue-500 p-3 rounded-md hover:bg-blue-600 font-medium"
                                >
                                    Link Gmail
                                </Link>
                            </div>
                        </div>
                    )
                ) : (
                    <div>
                        <h2 className="text-2xl font-bold mb-6 text-emphasis">
                            Please log in or register.
                        </h2>
                        <div className="flex flex-col gap-y-4">
                            <Link
                                to="/login"
                                className="w-full text-white bg-blue-500 p-3 rounded-md hover:bg-blue-600 font-medium"
                            >
                                Login
                            </Link>
                            <Link
                                to="/register"
                                className="w-full text-emphasis bg-surface-alt p-3 rounded-md hover:bg-surface-card font-medium"
                            >
                                Register
                            </Link>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default Home;
