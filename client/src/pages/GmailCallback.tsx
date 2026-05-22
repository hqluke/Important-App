import { useSearchParams, Link } from "react-router-dom";

const GmailCallback = () => {
    const [searchParams] = useSearchParams();
    const success = searchParams.get("success") === "true";
    const error = searchParams.get("error");

    return (
        <div className="min-h-[80vh] flex items-center justify-center p-4">
            <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-lg text-center">
                {success ? (
                    <>
                        <h2 className="text-2xl font-bold mb-4 text-green-600">
                            Gmail Connected!
                        </h2>
                        <p className="mb-6 text-gray-600">
                            Your Gmail account has been linked successfully.
                        </p>
                        <Link
                            to="/"
                            className="text-blue-500 hover:underline font-medium"
                        >
                            Back to Home
                        </Link>
                    </>
                ) : (
                    <>
                        <h2 className="text-2xl font-bold mb-4 text-red-600">
                            Connection Failed
                        </h2>
                        <p className="mb-6 text-gray-600">
                            {error === "missing_code" &&
                                "No authorization code received from Google."}
                            {error === "invalid_state" &&
                                "Session expired. Please try again."}
                            {error === "exchange_failed" &&
                                "Failed to exchange code with Google."}
                            {!error && "An unknown error occurred."}
                        </p>
                        <Link
                            to="/gmail"
                            className="text-blue-500 hover:underline font-medium"
                        >
                            Try Again
                        </Link>
                    </>
                )}
            </div>
        </div>
    );
};

export default GmailCallback;
