import { useState } from "react";
import {
    BrowserRouter as Router,
    Routes,
    Route,
    Navigate,
} from "react-router-dom";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import GmailAuth from "./pages/GmailAuth";
import GmailCallback from "./pages/GmailCallback";
import type { User } from "../types";

function App() {
    // Lazy load user and token from local storage
    const [user, setUser] = useState<User | null>(() => {
        const saved = localStorage.getItem("user");
        return saved ? JSON.parse(saved) : null;
    });
    const [token, setToken] = useState<string | null>(() =>
        localStorage.getItem("token"),
    );
    const [error, setError] = useState("");

    // Null clears user and token from local storage
    const handleSetUser = (newUser: User | null) => {
        setUser(newUser);
        if (newUser) {
            localStorage.setItem("user", JSON.stringify(newUser));
        } else {
            localStorage.removeItem("user");
        }
    };

    const handleSetToken = (newToken: string | null) => {
        setToken(newToken);
        if (newToken) {
            localStorage.setItem("token", newToken);
        } else {
            localStorage.removeItem("token");
        }
    };

    return (
        <Router>
            <Routes>
                <Route path="/" element={<Home user={user} error={error} />} />
                <Route
                    path="/login"
                    element={
                        user ? (
                            <Navigate to="/" />
                        ) : (
                            <Login
                                setUser={handleSetUser}
                                setToken={handleSetToken}
                                setError={setError}
                            />
                        )
                    }
                />
                <Route
                    path="/register"
                    element={
                        user ? (
                            <Navigate to="/" />
                        ) : (
                            <Register
                                setUser={handleSetUser}
                                setToken={handleSetToken}
                                setError={setError}
                            />
                        )
                    }
                />
                <Route
                    path="/gmail"
                    element={token ? <GmailAuth /> : <Navigate to="/login" />}
                />
                {/* Called by Gmail after user authorizes app */}
                <Route path="/gmail/callback" element={<GmailCallback />} />
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </Router>
    );
}

export default App;
