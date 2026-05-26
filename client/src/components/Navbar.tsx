import { useAuth } from "../context/AuthContext";
import logo from "../assets/important-app-logo-yellow-white-text.svg";
import { useNavigate } from "react-router-dom";

const Navbar = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate("/");
    };

    return (
        <div className="flex justify-between items-center p-4 bg-surface-alt">
            <img
                className="h-12 cursor-pointer p-0 m-0"
                src={logo}
                alt="logo"
                onClick={() => navigate("/")}
            />
            <div className="flex gap-x-4 items-center">
                {user && (
                    <>
                        <button
                            onClick={() => navigate("/setup")}
                            className="text-muted hover:text-emphasis transition-colors"
                        >
                            Setup
                        </button>
                        <button
                            onClick={() => navigate("/settings")}
                            className="text-muted hover:text-emphasis transition-colors"
                        >
                            Settings
                        </button>
                        <button
                            onClick={handleLogout}
                            className="bg-blue-500 text-white p-2 px-4 rounded-md"
                        >
                            Logout
                        </button>
                    </>
                )}
            </div>
        </div>
    );
};

export default Navbar;
