import { createContext, useContext, useEffect, useState } from "react";
import type { User } from "../../types";
import { getGmailStatus, disconnectGmail } from "../api/gmail";

interface AuthContextValue {
    user: User | null;
    token: string | null;
    error: string;
    gmailConnected: boolean;
    gmailLoading: boolean;
    sendersSetup: boolean;
    keywordsSetup: boolean;
    updateSendersSetup: (setup: boolean) => void;
    updateKeywordsSetup: (setup: boolean) => void;
    setError: (error: string) => void;
    setAuth: (token: string, user: User) => void;
    logout: () => void;
    logoutGmail: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(() => {
        const saved = localStorage.getItem("user");
        return saved ? JSON.parse(saved) : null;
    });
    const [token, setToken] = useState<string | null>(() =>
        localStorage.getItem("token"),
    );
    const [error, setError] = useState("");
    const [gmailConnected, setGmailConnected] = useState(false);
    const [gmailLoading, setGmailLoading] = useState(true);
    const [sendersSetup, setSendersSetup] = useState(false);
    const [keywordsSetup, setKeywordsSetup] = useState(false);

    useEffect(() => {
        if (user) {
            setGmailLoading(true);
            getGmailStatus()
                .then((status) => {
                    setGmailConnected(status.connected);
                    setSendersSetup(status.sendersSetup);
                    setKeywordsSetup(status.keywordsSetup);
                })
                .catch(() => {
                    setGmailConnected(false);
                    setSendersSetup(false);
                    setKeywordsSetup(false);
                })
                .finally(() => setGmailLoading(false));
        } else {
            setGmailConnected(false);
            setGmailLoading(false);
        }
    }, [user]);

    const setAuth = (newToken: string, newUser: User) => {
        setToken(newToken);
        setUser(newUser);
        localStorage.setItem("token", newToken);
        localStorage.setItem("user", JSON.stringify(newUser));
    };

    const logout = () => {
        setToken(null);
        setUser(null);
        setError("");
        setGmailConnected(false);
        localStorage.removeItem("token");
        localStorage.removeItem("user");
    };

    const logoutGmail = async () => {
        try {
            await disconnectGmail();
            setGmailConnected(false);
        } catch {
            setGmailConnected(false);
        }
    };

    const updateSendersSetup = (setup: boolean) => {
        setSendersSetup(setup);
    };

    const updateKeywordsSetup = (setup: boolean) => {
        setKeywordsSetup(setup);
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                token,
                error,
                gmailConnected,
                gmailLoading,
                sendersSetup,
                keywordsSetup,
                updateSendersSetup,
                updateKeywordsSetup,
                setError,
                setAuth,
                logout,
                logoutGmail,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error("useAuth must be used within AuthProvider");
    return ctx;
}
