import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export default function AppHeader() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const initials =
    `${user?.first_name?.[0] ?? ""}${user?.last_name?.[0] ?? ""}`.toUpperCase();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <header className="bg-[#2E308E] px-4 py-3 flex items-center justify-between">
      {/* Brand */}
      <div className="flex items-center gap-2">
        <div className="hidden sm:flex font-bold text-2xl tracking-wide text-white">
          ACLC
          <span className="text-[#D91B22]">xp</span>
        </div>

        <span className="sm:hidden text-white font-bold text-base">
          ACLC<span className="text-[#D91B22]">xp</span>
        </span>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3">
        {/* Notifications */}
        <button
          aria-label="Notifications"
          className="text-white/70 hover:text-white transition-colors"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 10-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
            />
          </svg>
        </button>

        {/* Avatar */}
        <div className="w-8 h-8 rounded-full bg-indigo-400 flex items-center justify-center text-white text-xs font-semibold">
          {initials}
        </div>

        {/* Logout */}
        <button
          onClick={handleLogout}
          aria-label="Logout"
          className="text-white/70 hover:text-white transition-colors"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h6a2 2 0 012 2v1"
            />
          </svg>
        </button>
      </div>
    </header>
  );
}