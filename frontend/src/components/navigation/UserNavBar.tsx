import { useState, useRef, useEffect } from "react";   
import { Link, useNavigate, useLocation } from "react-router-dom";
import { UserNavItems } from "./NavItems";        
import { HiMenu, HiChevronDown, HiExternalLink } from "react-icons/hi";
import { useAuth } from "../../context/AuthContext";

import LoadingScreen from "../../components/feedback/LoadingScreen";    
import MobileDrawer from "./MobileDrawer";

export default function Header() {  
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [showTransition, setShowTransition] = useState(false);
  const { user, logout } = useAuth();

  const dropdownRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const handler = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setProfileOpen(false);
      }
    };

    document.addEventListener("mousedown", handler);

    return () =>
      document.removeEventListener(
        "mousedown",
        handler
      );
  }, []);

  const drawerItems = UserNavItems;

  const handleLogoClick = () => {
    if (location.pathname === "/") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      navigate("/");
    }
  };

  const handleLogout = async () => {

    setShowTransition(true);      
    await new Promise(resolve => setTimeout(resolve, 1500));
    await logout();
    navigate("/", { replace: true });
  };

  if (showTransition) {  
    return <LoadingScreen />; 
  } 

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
                {UserNavItems.map((item) => {
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
        <div className="hidden lg:flex items-center gap-3 relative">
              <div
                ref={dropdownRef}
                className="relative"
              >
                <button
                  onClick={() => setProfileOpen(!profileOpen)}
                  className="
                    flex items-center gap-2
                    px-3 py-1.5
                    rounded-lg
                    bg-white/10
                    hover:bg-white/20
                    transition-colors
                  "
                >

                  <span className="text-white font-md font-arcade">
                    {user?.first_name}
                  </span>

                  <HiChevronDown
                    className={`
                      text-white
                      transition-transform
                      ${profileOpen ? "rotate-180" : ""}
                    `}
                  />

                </button>
              
                {profileOpen && (
                  <div
                    className="absolute top-full right-0 mt-2 w-60 bg-[#1E1E1E] border border-white/10 rounded-md overflow-hidden shadow-xl"
                  >
                    <div className="px-4 py-3 border-b border-white/10">
                      <p className="text-white font-semibold">
                        {user?.first_name} {user?.last_name}
                      </p>
                      <p className="text-white/50 text-sm">
                        {user?.email}
                      </p>
                    </div>
                    {/* align items vertically */}
                    <div className="flex flex-col items-start py-3 px-1 mx-2 mb-1 ">
                      <Link
                        to="/profile"
                        className="flex item-start px-3 py-1 rounded-sm w-full text-sm text-white hover:bg-white/10"
                      >
                        Profile
                      </Link>

                      <button
                        className="flex item-start px-3 py-1 rounded-sm w-full text-sm text-white hover:bg-white/10"
                      >
                        Support
                      </button>

                      <button
                        onClick={handleLogout}
                        className="flex item-start px-3 py-1 rounded-sm w-full text-sm text-white hover:bg-white/10"
                      >
                        Logout
                      </button>
                    </div>
                  </div>
                )}
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
        user={user}
      />
      </div>
      
    </header>    
  );
}