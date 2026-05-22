import { useEffect, useState } from "react";
import api from "../api/client";

const GmailAuth = () => {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        api.get<{ url: string }>("/gmail/auth")
            .then((res) => {
                window.location.href = res.data.url;
            })
            .catch(() => {
                setError("Failed to get Gmail auth URL");
                setLoading(false);
            });
    }, []);

    if (error) {
        return (
            <div className="min-h-[80vh] flex items-center justify-center p-4">
                <p className="text-red-500">{error}</p>
            </div>
        );
    }

    return (
        <div className="min-h-[80vh] flex items-center justify-center p-4">
            <p>{loading ? "Redirecting to Google..." : "Redirecting..."}</p>
        </div>
    );
};

export default GmailAuth;
