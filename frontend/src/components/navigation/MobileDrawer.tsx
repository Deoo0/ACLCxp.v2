import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { ChevronDown, ChevronRight, LogOut, QrCode, UserRound, X } from "lucide-react";
import type { NavItem } from "./NavItems";
import { useAuth } from "../../context/AuthContext";

interface MobileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  items: NavItem[];
  onQrCode?: () => void;
}

export default function MobileDrawer({ isOpen, onClose, items, onQrCode }: MobileDrawerProps) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [housesOpen, setHousesOpen] = useState(false);

  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  const handleLogout = async () => {
    await logout();
    onClose();
    navigate("/", { replace: true });
  };

  const closeAndShowQr = () => {
    onClose();
    onQrCode?.();
  };

  return (
    <div className={`fixed inset-0 z-[60] lg:hidden ${isOpen ? "pointer-events-auto" : "pointer-events-none"}`} aria-hidden={!isOpen}>
      <button type="button" tabIndex={isOpen ? 0 : -1} onClick={onClose} className={`absolute inset-0 bg-black/70 backdrop-blur-sm transition-opacity ${isOpen ? "opacity-100" : "opacity-0"}`} aria-label="Close navigation menu" />
      <aside className={`absolute inset-y-0 right-0 flex w-[min(88vw,360px)] flex-col border-l border-white/10 bg-neutral-950 p-5 shadow-2xl shadow-black/50 transition-transform duration-300 ${isOpen ? "translate-x-0" : "translate-x-full"}`} aria-label="Mobile navigation">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold tracking-wide text-neutral-100">Menu</p>
          <button type="button" onClick={onClose} className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-neutral-300 transition hover:bg-white/[0.08]" aria-label="Close navigation menu"><X className="h-5 w-5" /></button>
        </div>

        <div className="mt-6 rounded-2xl border border-white/10 bg-neutral-900/70 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-full bg-amber-400 text-sm font-bold text-neutral-950">
              {user?.profile_photo ? <img src={user.profile_photo} alt="" className="h-full w-full object-cover" /> : `${user?.first_name?.[0] ?? ""}${user?.last_name?.[0] ?? ""}`.toUpperCase() || "S"}
            </div>
            <div className="min-w-0"><p className="truncate text-sm font-semibold text-neutral-100">{user?.full_name || "Student"}</p><p className="mt-0.5 truncate text-xs text-neutral-500">{user?.house_name || user?.program || "ACLC student"}</p></div>
          </div>
          <button type="button" onClick={closeAndShowQr} className="mt-4 flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-amber-400 px-4 text-sm font-semibold text-neutral-950 transition hover:bg-amber-300"><QrCode className="h-4 w-4" /> Show my QR code</button>
        </div>

        <nav className="mt-6 space-y-1" aria-label="Student pages">
          {items.map((item) => {
            if (item.children) {
              return <div key={item.label} className="pt-2"><button type="button" onClick={() => setHousesOpen((open) => !open)} aria-expanded={housesOpen} className="flex min-h-11 w-full items-center justify-between rounded-xl px-3 text-left text-sm font-medium text-neutral-300 transition hover:bg-white/[0.05]"><span>{item.label}</span><ChevronDown className={`h-4 w-4 text-neutral-500 transition-transform ${housesOpen ? "rotate-180" : ""}`} /></button>{housesOpen && <div className="mt-1 space-y-1 border-l border-white/10 pl-3">{item.children.map((child) => <a key={child.label} href={child.href} target="_blank" rel="noreferrer" className="flex min-h-10 items-center rounded-lg px-3 text-sm text-neutral-500 transition hover:bg-white/[0.04] hover:text-neutral-200">{child.label}</a>)}</div>}</div>;
            }
            const active = location.pathname === item.path;
            return <Link key={item.path} to={item.path!} onClick={onClose} className={`flex min-h-11 items-center justify-between rounded-xl px-3 text-sm font-medium transition ${active ? "bg-amber-400/10 text-amber-300" : "text-neutral-300 hover:bg-white/[0.05]"}`}><span>{item.label}</span><ChevronRight className={`h-4 w-4 ${active ? "text-amber-400" : "text-neutral-600"}`} /></Link>;
          })}
        </nav>

        <div className="mt-auto space-y-1 border-t border-white/[0.08] pt-4">
          <Link to="/profile" onClick={onClose} className="flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm text-neutral-300 transition hover:bg-white/[0.05]"><UserRound className="h-4 w-4 text-neutral-500" /> Profile settings</Link>
          <button type="button" onClick={handleLogout} className="flex min-h-11 w-full items-center gap-3 rounded-xl px-3 text-left text-sm text-rose-300 transition hover:bg-rose-400/10"><LogOut className="h-4 w-4" /> Sign out</button>
        </div>
      </aside>
    </div>
  );
}
