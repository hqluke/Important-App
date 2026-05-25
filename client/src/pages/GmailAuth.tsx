import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import api from "../api/client";
import { useAuth } from "../context/AuthContext";

const GmailAuth = () => {
    const { token } = useAuth();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        if (!token) return;
        api.get<{ url: string }>("/gmail/auth")
            .then((res) => {
                window.location.href = res.data.url;
            })
            .catch(() => {
                setError("Failed to get Gmail auth URL");
                setLoading(false);
            });
    }, [token]);

    if (!token) return <Navigate to="/login" />;

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
