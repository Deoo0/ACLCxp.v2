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
            className={`fixed top-0 w-full z-50 bg-[#1E1E1E] border-white/10 px-8 py-2 transition-transform duration-300`}
        >
            <div className="flex items-center justify-between mx-auto">

                {/* Logo */}
                <div
                    onClick={handleLogoClick}
                    className="flex items-center gap-1 cursor-pointer"
                >
                    <img
                        src="aclcxp-logo.png"
                        alt="ACLCxp Logo"
                        className="w-14 h-14 object-contain"
                        />
                    <div className="flex translate-y-0.5">
                        <h1 className="font-bold text-2xl tracking-wide hidden sm:inline text-white">
                            ACLC
                        </h1>
                        <span className="text-[#D91B22] text-sm font-bold ml-1 tracking-wide hidden sm:inline font-arcade">XP</span>
                    </div>
                </div>

                {/* Login Button */}
            <Link
                to="/login"
                className="px-3 py-1 border-2 border-[yellow] text-[yellow] hover:bg-[yellow] hover:border-[black] hover:text-[black] rounded-lg font-arcade text-md transition-colors duration-200"
                >
                <p className="translate-y-px">Login</p> 
            </Link>
            </div>
        </header>
    );
}