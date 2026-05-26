import { useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import EmailScanSetup from "../components/EmailScanSetup";
import KeywordsSetup from "../components/KeywordsSetup";

const Setup = () => {
    const { user, gmailConnected, sendersSetup } = useAuth();
    const [showKeywords, setShowKeywords] = useState(sendersSetup);

    if (!user || !gmailConnected) return <Navigate to="/" />;

    return (
        <div>
            {showKeywords ? (
                <KeywordsSetup />
            ) : (
                <EmailScanSetup onSaved={() => setShowKeywords(true)} />
            )}
        </div>
    );
};

export default Setup;
