import { NavLink, useLocation } from "react-router-dom";
import type { IconType } from "react-icons";

export interface BottomNavItem {
  label: string;
  path: string;
  icon: IconType;
}

export interface BottomNavCenterAction {
  label: string;
  icon: IconType;
  path?: string;
  onClick?: () => void;
}

interface BottomNavigationProps {
  items: [BottomNavItem, BottomNavItem, BottomNavItem, BottomNavItem];
  centerAction: BottomNavCenterAction;
}

export default function BottomNavigation({ items, centerAction }: BottomNavigationProps) {
  const location = useLocation();
  const [left, right] = [items.slice(0, 2), items.slice(2, 4)];
  const CenterIcon = centerAction.icon;

  const isActive = (path: string) => location.pathname === path || location.pathname.startsWith(`${path}/`);
  const NavButton = ({ item }: { item: BottomNavItem }) => {
    const Icon = item.icon;
    const active = isActive(item.path);
    return (
      <NavLink to={item.path} className={`relative flex min-h-14 min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-xl px-0.5 text-[11px] font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 ${active ? "text-amber-300" : "text-neutral-400 hover:text-neutral-200"}`} aria-current={active ? "page" : undefined}>
        {active && <span className="absolute top-1 h-1 w-1 rounded-full bg-amber-400" aria-hidden="true" />}
        <Icon className={`h-5 w-5 ${active ? "text-amber-400" : ""}`} aria-hidden="true" />
        <span>{item.label}</span>
      </NavLink>
    );
  };

  const centerClasses = "absolute left-1/2 -top-7 flex h-14 w-14 -translate-x-1/2 items-center justify-center rounded-2xl border-4 border-neutral-950 bg-amber-400 text-neutral-950 shadow-lg shadow-amber-400/20 transition active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300";

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 px-3 pb-[calc(env(safe-area-inset-bottom)+10px)] pt-5 lg:hidden" aria-label="Primary navigation">
      <div className="relative mx-auto flex max-w-md items-center rounded-2xl border border-white/10 bg-neutral-900/95 px-2 py-1.5 shadow-2xl shadow-black/40 backdrop-blur-xl">
        <div className="flex min-w-0 flex-1">{left.map((item) => <NavButton key={item.path} item={item} />)}</div>
        <div className="w-16 shrink-0" aria-hidden="true" />
        <div className="flex min-w-0 flex-1">{right.map((item) => <NavButton key={item.path} item={item} />)}</div>
        {centerAction.path ? <NavLink to={centerAction.path} className={centerClasses} aria-label={centerAction.label}><CenterIcon className="h-6 w-6" /></NavLink> : <button type="button" onClick={centerAction.onClick} className={centerClasses} aria-label={centerAction.label}><CenterIcon className="h-6 w-6" /></button>}
      </div>
    </nav>
  );
}
