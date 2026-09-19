import MobileTopBar from "./MobileTopBar";
import { useEffect, useRef, useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { ChevronDown, LogOut, Trophy, UserRound } from "lucide-react";
import { UserNavItems } from "./NavItems";
import { useAuth } from "../../context/AuthContext";

const primaryItems = UserNavItems.filter((item) => item.path);
const housesItem = UserNavItems.find((item) => item.children);

export default function UserNavBar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [profileOpen, setProfileOpen] = useState(false);
  const [housesOpen, setHousesOpen] = useState(false);
  const desktopMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const closeMenus = (event: MouseEvent) => {
      if (!desktopMenuRef.current?.contains(event.target as Node)) {
        setProfileOpen(false);
        setHousesOpen(false);
      }
    };
    document.addEventListener("mousedown", closeMenus);
    return () => document.removeEventListener("mousedown", closeMenus);
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate("/", { replace: true });
  };

  const initials = `${user?.first_name?.[0] ?? ""}${user?.last_name?.[0] ?? ""}`.toUpperCase() || "S";

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-white/[0.08] bg-neutral-950/90 backdrop-blur-xl">
      <MobileTopBar user={user} onLogout={handleLogout} />
      <div ref={desktopMenuRef} className="mx-auto hidden lg:flex h-20 w-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-4 lg:gap-8">
          <Link to="/dashboard" className="flex shrink-0 items-center gap-2.5 rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-amber-400">
            <img src="/aclcxp-logo.png" alt="ACLCxp" className="h-10 w-10 object-contain" />
            <span className="hidden text-lg font-semibold tracking-tight text-neutral-50 sm:block">ACLC<span className="text-amber-400">xp</span></span>
          </Link>

          <nav className="hidden items-center gap-1 lg:flex" aria-label="Student navigation">
            {primaryItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path!}
                className={({ isActive }) => `rounded-lg px-3 py-2 text-sm font-medium transition ${isActive ? "bg-white/[0.08] text-neutral-50" : "text-neutral-400 hover:bg-white/[0.05] hover:text-neutral-200"}`}
              >
                {item.label}
              </NavLink>
            ))}
            {housesItem && (
              <div className="relative">
                <button type="button" onClick={() => setHousesOpen((open) => !open)} aria-expanded={housesOpen} className="inline-flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium text-neutral-400 transition hover:bg-white/[0.05] hover:text-neutral-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400">
                  Houses <ChevronDown className={`h-4 w-4 transition-transform ${housesOpen ? "rotate-180" : ""}`} />
                </button>
                <div data-state={housesOpen ? "open" : "closed"} inert={!housesOpen} className="topbar-dropdown-persistent absolute left-0 top-full mt-2 w-60 overflow-hidden rounded-xl border border-white/10 bg-neutral-900 p-1.5 shadow-2xl shadow-black/40">
                    <p className="px-3 pb-1.5 pt-2 text-[11px] font-medium uppercase tracking-wider text-neutral-500">Student houses</p>
                    {housesItem.children?.map((house) => <a key={house.label} href={house.href} target="_blank" rel="noreferrer" className="block rounded-lg px-3 py-2 text-sm text-neutral-300 transition hover:bg-white/[0.06] hover:text-neutral-50">{house.label}</a>)}
                  </div>
              </div>
            )}
          </nav>
        </div>

        <div className="hidden items-center gap-2 lg:flex">
          <Link to="/stats" className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3 text-sm font-medium text-neutral-200 transition hover:bg-white/[0.08] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400">
            <Trophy className="h-4 w-4 text-amber-400" /> Leaderboard
          </Link>
          <div className="relative">
            <button type="button" onClick={() => setProfileOpen((open) => !open)} aria-expanded={profileOpen} className="flex min-h-10 items-center gap-2 rounded-xl px-2 py-1.5 transition hover:bg-white/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400">
              <span className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-amber-400 text-xs font-bold text-neutral-950">
                {user?.profile_photo ? <img src={user.profile_photo} alt="" className="h-full w-full object-cover" /> : initials}
              </span>
              <span className="max-w-28 truncate text-sm font-medium text-neutral-200">{user?.first_name || "Student"}</span>
              <ChevronDown className={`h-4 w-4 text-neutral-500 transition-transform ${profileOpen ? "rotate-180" : ""}`} />
            </button>
            <div data-state={profileOpen ? "open" : "closed"} inert={!profileOpen} className="topbar-dropdown-persistent absolute right-0 top-full mt-2 w-72 overflow-hidden rounded-xl border border-white/10 bg-neutral-900 p-1.5 shadow-2xl shadow-black/40">
                <div className="border-b border-white/[0.07] px-3 py-3">
                  <p className="truncate text-sm font-semibold text-neutral-100">{user?.full_name || "Student"}</p>
                  <p className="mt-0.5 truncate text-xs text-neutral-500">{user?.email}</p>
                  {user?.house_name && <p className="mt-2 flex items-center gap-1.5 text-xs text-neutral-400"><span className="h-2 w-2 rounded-full" style={{ backgroundColor: user.house_color || "#F5B300" }} />{user.house_name}</p>}
                </div>
                <Link to="/profile" onClick={() => setProfileOpen(false)} className="mt-1 flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm text-neutral-300 transition hover:bg-white/[0.06] hover:text-neutral-50"><UserRound className="h-4 w-4" /> Profile</Link>
                <button type="button" onClick={handleLogout} className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm text-rose-300 transition hover:bg-rose-400/10"><LogOut className="h-4 w-4" /> Sign out</button>
              </div>
          </div>
        </div>


      </div>
    </header>
  );
}
