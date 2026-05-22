import { Link } from "react-router-dom";
import { useNavigate, useLocation } from "react-router-dom";

export default function Header() {
    const navigate = useNavigate();
    const location = useLocation();


    const handleLogoClick = () => {
        if (location.pathname === "/") {
            window.scrollTo({ top: 0, behavior: "smooth" });
        } else {
            navigate("/");
        }
    };


    return (
        <header
            className={`fixed top-0 w-full z-50 bg-[#2E308E] backdrop-blur-sm border-b border-white/10 px-4 py-2 transition-transform duration-300`}
        >
            <div className="flex items-center justify-between max-w-6xl mx-auto">

                {/* Logo */}
                <div
                    onClick={handleLogoClick}
                    className="flex items-center gap-2 cursor-pointer"
                >
                    <img
                        src="aclcxp-logo.png"
                        alt="ACLCxp Logo"
                        className="w-12 h-12 object-contain"
                        />
                    <div>
                        <h1 className="font-bold text-2xl tracking-wide hidden sm:inline text-white">
                            ACLC
                        </h1>
                        <h1 className="font-bold text-2xl tracking-wide hidden sm:inline text-[#D91B22]">
                            xp
                        </h1>
                    </div>
                </div>

                {/* Login Button */}
                <Link
                    to="/login"
                    className="px-2 py-1 bg-white text-[#2E308E] hover:bg-gray-100 rounded-lg font-semibold text-sm transition-colors duration-200"
                >
                    Log-in
                </Link>
            </div>
        </header>
    );
}