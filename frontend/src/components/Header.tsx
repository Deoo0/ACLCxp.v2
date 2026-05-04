import { useNavigate, useLocation } from "react-router-dom";
import logo from "../assets/aclcxp-logo.png";

export default function Header() {
    const navigate = useNavigate();
    const location = useLocation();

    const handleLogoClick = () => {
        if (location.pathname === "/") {
            // Already on landing → scroll to top
            window.scrollTo({ top: 0, behavior: "smooth" });
        } else {
            // Go to home
            navigate("/");
        }
    };
    
    return (
    <header className="sticky top-0 z-50 bg-[#2E308E] backdrop-blur-sm border-b border-white/10 px-4 py-2">
        <div className="flex items-center justify-between max-w-6xl mx-auto">

            {/* Logo */}
            <div 
            onClick={handleLogoClick} 
            className="flex items-center gap-2 cursor-pointer"
            >
                <img 
                    src={logo} 
                    alt="ACLCxp Logo" 
                    className="w-13 h-13 object-contain" 
                />
                <span className="font-bold text-xl tracking-wide hidden sm:inline text-white">
                    ACLCxp
                </span>
            </div>
            
            {/* Login Button */}
            <a href="#login" className="px-2 py-1 bg-white text-[#2E308E] hover:bg-gray-100 rounded-lg font-semibold text-sm transition-colors duration-200">
                Log-in
            </a>

        </div>
    </header>
  )
}
