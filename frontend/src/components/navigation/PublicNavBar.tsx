import { useState } from "react";   
import { Link, useNavigate, useLocation } from "react-router-dom";
import { PublicNavItems } from "./NavItems";        
import { HiMenu, HiChevronDown, HiExternalLink } from "react-icons/hi";

import MobileDrawer from "./MobileDrawer";

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
    
    const [menuOpen, setMenuOpen] = useState(false);

    const drawerItems = PublicNavItems;

    return (
        <header
            className={`fixed top-0 w-full z-50 bg-[#1E1E1E] border-white/10 px-8 py-2 transition-transform duration-300`}
        >
            <div className="flex items-center justify-between mx-auto">

                {/* Left Side Div */}
                <div className="flex items-center gap-8">
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

                    {/* line separator */}
                    <div className="w-0.5 h-9 bg-white/50 hidden lg:inline" />

                    {/* Navigation links */}
                    <nav className="font-arcade text-md text-[white] hidden lg:flex gap-2">
                        {PublicNavItems.map((item) => {
                            if (item.children) {
                                return (
                                <div
                                    key={item.label}
                                    className="relative group"
                                >
                                    <button className="text-white hover:text-[#D91B22] hover:bg-white/25 px-2 rounded-md transition-colors flex items-center gap-1">
                                    {item.label}
                                    <HiChevronDown/>
                                    </button>

                                    <div
                                    className="absolute top-full left-0 mt-2 w-50 rounded-md bg-[#1E1E1E] border border-white/20 invisible group-hover:opacity-100 group-hover:visible transition-all"
                                    >
                                    {item.children.map((child) => (
                                        <a
                                        key={child.label}
                                        href={child.href}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="block px-4 py-2 text-md text-white hover:bg-[#D91B22] hover:text-white"
                                        >
                                            {child.label}
                                            <HiExternalLink className="inline ml-1 text-white/50" />
                                        </a>
                                    ))}
                                    </div>
                                </div>
                                );
                            }

                            return (
                                <Link
                                key={item.path}
                                to={item.path!}
                                className="hover:text-[#D91B22] hover:bg-white/25 px-2 rounded-md transition-colors"
                                >
                                {item.label}
                                </Link>
                            );
                            })}
                    </nav>
                </div>

                {/* Button Right Side Div */}
                <div className="hidden lg:flex items-end gap-4">
                    {/* Login Button */}
                    <Link
                        to="/login"
                        className="px-3 py-1 border bg-[yellow] border-[black] text-[black] hover:bg-white/0 hover:border-[white] hover:text-[] rounded-lg font-arcade text-md transition-colors duration-200"
                        >
                        <p className="translate-y-px">Login</p> 
                    </Link>

                    {/* Register Button */}
                    <Link
                        to="/register"
                        className="px-3 py-1 border border-[black] bg-[#D91B22] text-[white] hover:bg-[black] hover:border-[#D91B22] hover:text-[#D91B22] rounded-lg font-arcade text-md transition-colors duration-200"
                        >
                        <p className="translate-y-px">Register</p> 
                    </Link>
                </div>

                {/* Mobile Hamburger */}
                <button
                    onClick={() => setMenuOpen(true)}
                    className="lg:hidden text-white text-2xl px-2.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 transition-colors duration-200"
                    >
                    <HiMenu size={28} />
                </button>
            </div>
            <MobileDrawer   
                isOpen={menuOpen}   
                onClose={() => setMenuOpen(false)}
                items={drawerItems} 
            />  
        </header>    
    );
}