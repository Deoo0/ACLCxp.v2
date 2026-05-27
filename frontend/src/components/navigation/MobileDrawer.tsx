import { Link, useNavigate } from "react-router-dom";
import { useState, useRef, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import type { AuthUser } from "../../services/auth";
import { HiX, HiChevronDown } from "react-icons/hi";
import LoadingScreen from "../../components/feedback/LoadingScreen";

interface DrawerItem {
  label: string;
  path?: string;
  href?: string;
  children?: DrawerItem[];
}

interface MobileDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    items: DrawerItem[];
    user?: AuthUser | null;

}

export default function MobileDrawer({
    isOpen,
    onClose,
    items,
}: MobileDrawerProps) {
    const { user, logout } = useAuth();
    const [openGroup, setOpenGroup] = useState<string | null>(null);
    const [showTransition, setShowTransition] = useState(false);
    const drawerRef = useRef<HTMLDivElement>(null);
    const navigate = useNavigate();


    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "";
        }
        return () => {
            document.body.style.overflow = "";
        };
    }, [isOpen]);

    const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (drawerRef.current && !drawerRef.current.contains(e.target as Node)) {
            onClose();
        }
    };

    if (showTransition) {  
        return <LoadingScreen />; 
    } 

    return (
        <div className={`fixed inset-0 z-50 flex ${isOpen ? '' : 'pointer-events-none'}`}>
            {/* Overlay */}
            <div
                className={`fixed inset-0 bg-black/60 transition-opacity duration-300 ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
                onClick={handleOverlayClick}
            />

            {/* Drawer */}
            <aside
                ref={drawerRef}
                className={`fixed top-0 right-0 w-80 h-full bg-[#1E1E1E] z-50 p-6 transform transition-transform duration-300 ease-in-out
                    ${isOpen ? 'translate-x-0 opacity-100 pointer-events-auto' : 'translate-x-full opacity-0 pointer-events-none'}`}
                tabIndex={-1}
            >
                {/* Header */}
                <div className="flex justify-between items-center mb-8">
                    <h2 className="text-white text-2xl">
                        MENU
                    </h2>

                    <button
                        onClick={onClose}
                        className="text-white text-3xl bg-white/10 hover:bg-white/20 p-2 rounded-xl transition-colors duration-200"
                    >
                        <HiX />
                    </button>
                </div>

                {/* Links */}
                <nav className="flex flex-col gap-4">
                    {items.map((item) => {
                        if (item.children?.length) {
                            const isGroupOpen = openGroup === item.label;
                            return (
                                <div key={item.label}>
                                    <button
                                        onClick={() => setOpenGroup(isGroupOpen ? null : item.label)}
                                        className="flex justify-between items-center w-full text-white font-arcade text-xl hover:text-[#D91B22] hover:bg-white/10 p-2 rounded-lg transition-colors duration-200"
                                    >
                                        {item.label}
                                        <span
                                            className={`
                                                transition-transform
                                                duration-300
                                                ${isGroupOpen ? "rotate-180" : ""}
                                            `}
                                        >
                                            <HiChevronDown />
                                        </span>
                                    </button>
                                    {isGroupOpen && (
                                        <div className="mt-4 flex flex-col gap-4">
                                            {item.children.map((child) => (
                                                <a
                                                    key={child.label}
                                                    href={child.href}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-white/60 text-xl font-arcade hover:bg-white/10 p-2 rounded-lg transition-colors duration-200"
                                                >
                                                    {child.label}
                                                </a>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            );
                        }
                        return (
                            <Link
                                key={item.path}
                                to={item.path!}
                                onClick={onClose}
                                className="text-white font-arcade text-xl hover:text-[#D91B22] hover:bg-white/10 p-2 rounded-lg transition-colors duration-200"
                            >
                                {item.label}
                            </Link>
                        );
                    })}
                </nav>
                <div className="mt-10 border-t border-white/10 pt-4">
                    {!user ? (
                        <div className="flex flex-col gap-3">
                            <Link
                                to="/login"
                                onClick={onClose}
                                className="w-full text-center p-3 rounded-lg border-3 border-black text-black bg-[yellow] font-arcade"
                            >
                                Login
                            </Link>
                            <Link
                                to="/register"
                                onClick={onClose}
                                className="w-full text-center p-3 rounded-lg border border-black  bg-[#D91B22] text-white font-arcade"
                            >
                                Register
                            </Link>
                        </div>
                    ) : (
                        <>
                            <div className="flex items-center gap-3 mb-4">
                                <div>
                                    <p className="text-white font-semibold">
                                        {user.first_name}
                                    </p>
                                    <p className="text-white/60 text-sm">
                                        {user.email}
                                    </p>
                                </div>
                            </div>
                            <div className="flex flex-col gap-2">
                                <Link
                                    to="/profile"
                                    onClick={onClose}
                                    className="text-white hover:bg-white/10 p-2 rounded-lg"
                                >
                                    Profile
                                </Link>
                                <button
                        onClick={async () => {
                            setShowTransition(true);      
                            await new Promise(resolve => setTimeout(resolve, 1500));
                            await logout();
                            navigate("/", { replace: true });
                            onClose();
                        }}
                        className="text-left text-white hover:bg-red-500/10 p-2 rounded-lg"
                        >
                        Logout
                        </button>
                    </div>
                    </>
                )}
                </div>
        </aside>
        </div>
    );
}