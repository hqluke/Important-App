import { useState } from "react";
import { useAuth } from "../context/AuthContext";

const GmailDisconnect = () => {
    const { gmailConnected, logoutGmail } = useAuth();
    const [pending, setPending] = useState(false);

    if (!gmailConnected) return null;

    const handleDisconnect = async () => {
        setPending(true);
        await logoutGmail();
        setPending(false);
    };

    return (
        <button
            onClick={handleDisconnect}
            disabled={pending}
            className="bg-red-500 text-white p-2 px-4 rounded-md disabled:opacity-50"
        >
            {pending ? "Disconnecting..." : "Disconnect Gmail"}
        </button>
    );
};

export default GmailDisconnect;
