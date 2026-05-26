import {
    BrowserRouter as Router,
    Routes,
    Route,
    Navigate,
} from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import Layout from "./components/Layout";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import GmailAuth from "./pages/GmailAuth";
import GmailCallback from "./pages/GmailCallback";
import Setup from "./pages/Setup";
import SettingsPage from "./pages/Settings";

function App() {
    return (
        <AuthProvider>
            <Router>
                <Routes>
                    <Route element={<Layout />}>
                        <Route path="/" element={<Home />} />
                        <Route path="/login" element={<Login />} />
                        <Route path="/register" element={<Register />} />
                        <Route path="/gmail/link" element={<GmailAuth />} />
                        <Route
                            path="/gmail/callback"
                            element={<GmailCallback />}
                        />
                        <Route path="/setup" element={<Setup />} />
                        <Route path="/settings" element={<SettingsPage />} />
                        <Route path="*" element={<Navigate to="/" replace />} />
                    </Route>
                </Routes>
            </Router>
        </AuthProvider>
    );
}

export default App;
