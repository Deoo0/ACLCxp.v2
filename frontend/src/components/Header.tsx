import { Link } from "react-router-dom";
import { useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import logo from "../assets/aclcxp-logo.png";

export default function Header() {
    const navigate = useNavigate();
    const location = useLocation();

    const [showHeader, setShowHeader] = useState(true);
    const [lastScrollY, setLastScrollY] = useState(0);

    const handleLogoClick = () => {
        if (location.pathname === "/") {
            window.scrollTo({ top: 0, behavior: "smooth" });
        } else {
            navigate("/");
        }
    };

  //Detect scroll direction
    useEffect(() => {
        const handleScroll = () => {
            if (window.scrollY > lastScrollY) {
                // scrolling down
                setShowHeader(false);
            } else {
                // scrolling up
                setShowHeader(true);
            }
            setLastScrollY(window.scrollY);
        };

        window.addEventListener("scroll", handleScroll);

        return () => window.removeEventListener("scroll", handleScroll);
    }, [lastScrollY]);

    return (
        <header
            className={`fixed top-0 w-full z-50 bg-[#2E308E] backdrop-blur-sm border-b border-white/10 px-4 py-2 transition-transform duration-300 ${
            showHeader ? "translate-y-0" : "-translate-y-full"
        }`}
        >
            <div className="flex items-center justify-between max-w-6xl mx-auto">

                {/* Logo */}
                <div
                    onClick={handleLogoClick}
                    className="flex items-center gap-2 cursor-pointer"
                >
                    <img
                        src={logo}
                        alt="ACLCxp Logo"
                        className="w-12 h-12 object-contain"
                    />
                    <span className="font-bold text-xl tracking-wide hidden sm:inline text-white">
                        ACLCxp
                    </span>
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