import { useAuth } from "../context/AuthContext";
import GmailDisconnect from "./GmailDisconnect";

const Navbar = () => {
    const { user, logout } = useAuth();

    return (
        <div className="flex justify-between items-center p-4 bg-white">
            <h1 className="text-2xl font-bold">Important!</h1>
            {user && (
                <div className="flex gap-x-4 items-center">
                    <GmailDisconnect />
                    <button
                        onClick={logout}
                        className="bg-blue-500 text-white p-2 px-4 rounded-md"
                    >
                        Logout
                    </button>
                </div>
            )}
        </div>
    );
};

export default Navbar;
