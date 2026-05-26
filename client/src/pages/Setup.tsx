import { useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import EmailScanSetup from "../components/EmailScanSetup";
import KeywordsSetup from "../components/KeywordsSetup";

const Setup = () => {
    const { user, gmailConnected } = useAuth();
    const [showKeywords, setShowKeywords] = useState(false);

    if (!user || !gmailConnected) return <Navigate to="/" />;

    return (
        <div>
            {showKeywords ? (
                <KeywordsSetup />
            ) : (
                <EmailScanSetup onSaved={() => setShowKeywords(true)} />
            )}
            {/*  {showKeywords && <KeywordsSetup />}*/}
        </div>
    );
};

export default Setup;
