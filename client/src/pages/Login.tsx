import { useState } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { login as apiLogin } from "../api/auth";
import { useAuth } from "../context/AuthContext";

const Login = () => {
    const { user, setAuth, setError } = useAuth();
    const [form, setForm] = useState({ email: "", password: "" });
    const [submitting, setSubmitting] = useState(false);
    const navigate = useNavigate();

    if (user) return <Navigate to="/" />;

    const handleSubmit = async (e: React.SyntheticEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const data = await apiLogin(form.email, form.password);
            setAuth(data.token, data.user);
            navigate("/");
        } catch {
            setError("Invalid email or password");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="min-h-[80vh] flex items-center justify-center p-4">
            <form
                className="bg-white p-6 rounded shadow-md w-full max-w-lg"
                onSubmit={handleSubmit}
            >
                <h2 className="text-2xl mb-6 font-bold text-center text-gray-800">
                    Login
                </h2>
                <input
                    type="email"
                    placeholder="email"
                    className="border p-2 w-full mb-3"
                    value={form.email}
                    onChange={(e) =>
                        setForm({ ...form, email: e.target.value })
                    }
                />
                <input
                    type="password"
                    placeholder="password"
                    className="border p-2 w-full mb-3"
                    value={form.password}
                    onChange={(e) =>
                        setForm({ ...form, password: e.target.value })
                    }
                />
                <button
                    className="bg-blue-500 text-white p-2 w-full disabled:opacity-50"
                    disabled={submitting}
                >
                    {submitting ? "Logging in..." : "Login"}
                </button>
            </form>
        </div>
    );
};

export default Login;
