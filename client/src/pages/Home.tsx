import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function Home() {
    const {
        user,
        error,
        gmailConnected,
        gmailLoading,
        sendersAndKeywordsSetup,
    } = useAuth();

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
                            <div className="flex gap-x-4">
                                <Link
                                    to="/setup"
                                    className="w-full text-white bg-blue-500 p-3 rounded-md hover:bg-blue-600 font-medium"
                                >
                                    Setup
                                </Link>
                                {sendersAndKeywordsSetup && (
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
