import { Link, useLocation } from "react-router-dom";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { ArrowUpRight, ChevronDown, LogOut, Menu, Trophy, Shield, UserRound, Zap } from "lucide-react";
import { PublicNavItems, UserNavItems } from "./NavItems";
import type { AuthUser } from "../../services/auth";

interface MobileTopBarProps {
  user?: AuthUser | null;
  onLogout?: () => void;
}

const menuItem = "flex min-h-11 cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-neutral-300 outline-none transition-colors focus:bg-white/10 focus:text-white";
const action = "flex h-11 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-neutral-200 outline-none transition-colors hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-amber-400";

export default function MobileTopBar({ user, onLogout }: MobileTopBarProps) {
  const { pathname } = useLocation();
  const currentPage = UserNavItems.find((item) => item.path === pathname)?.label || "Profile";
  const initials = `${user?.first_name?.[0] ?? ""}${user?.last_name?.[0] ?? ""}`.toUpperCase() || "S";

  return (
    <div className="relative lg:hidden">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(251,191,36,0.08),transparent_65%)]" aria-hidden="true" />
      <div className="relative mx-auto flex h-[72px] max-w-7xl items-center justify-between gap-3 px-4 sm:px-6">
        <Link to={user ? "/dashboard" : "/"} aria-label={user ? "ACLCxp dashboard" : "ACLCxp home"} className="flex min-w-0 items-center gap-2.5 rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-amber-400">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-amber-300/20 bg-amber-300/[0.06] shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
            <img src="/aclcxp-logo.png" alt="" className="h-9 w-9 object-contain" />
          </span>
          <span className="min-w-0">
            <span className="flex items-center gap-1.5 text-lg font-bold leading-6 tracking-tight text-white">ACLC<span className="font-arcade text-sm tracking-wide text-amber-300">XP</span></span>
            <span className="block truncate text-[9px] font-semibold uppercase tracking-[0.16em] text-neutral-400">{user ? currentPage : "Level up through fun"}</span>
          </span>
        </Link>

        <div className="flex shrink-0 items-center gap-2">
          {user ? (
            <Link to="/stats" aria-label="View leaderboard" aria-current={pathname === "/stats" ? "page" : undefined} className={`${action} w-11 text-amber-300`}><Trophy className="h-5 w-5" /></Link>
          ) : (
            <Link to="/login" className="inline-flex h-11 items-center gap-1.5 rounded-xl bg-amber-400 px-3 text-xs font-bold text-neutral-950 outline-none transition-colors hover:bg-amber-300 focus-visible:ring-2 focus-visible:ring-white"><Zap className="h-3.5 w-3.5" aria-hidden="true" />Log in</Link>
          )}
          <DropdownMenu.Root key={pathname}>
            <DropdownMenu.Trigger aria-label={user ? "Open account and navigation menu" : "Open navigation menu"} className={`topbar-menu-trigger ${action} ${user ? "gap-1 px-1.5" : "w-11"}`}>
              {user ? <><span className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-lg border border-amber-300/30 bg-amber-300/10 text-xs font-bold text-amber-200">{user.profile_photo ? <img src={user.profile_photo} alt="" className="h-full w-full object-cover" /> : initials}</span><ChevronDown className="topbar-menu-chevron h-3 w-3 text-neutral-400" /></> : <Menu className="h-5 w-5" />}
            </DropdownMenu.Trigger>
            <DropdownMenu.Portal>
              <DropdownMenu.Content align="end" sideOffset={12} collisionPadding={12} className="topbar-dropdown z-[60] max-h-[var(--radix-dropdown-menu-content-available-height)] w-80 max-w-[calc(100vw-24px)] overflow-y-auto rounded-2xl border border-white/10 bg-neutral-900 p-2 shadow-2xl shadow-black/60">
                <DropdownMenu.Label className="border-b border-white/10 px-3 pb-3 pt-2">
                  <span className="block text-[10px] font-semibold uppercase tracking-[0.18em] text-amber-300">{user ? "Player menu" : "Explore ACLCxp"}</span>
                  <span className="mt-1 block truncate text-base font-semibold text-white">{user ? user.full_name || "Student" : "Your next level starts here."}</span>
                  {user?.house_name && <span className="mt-2 flex items-center gap-1.5 text-xs text-neutral-400"><Shield className="h-3.5 w-3.5" style={{ color: user.house_color || "#fbbf24" }} />{user.house_name}</span>}
                </DropdownMenu.Label>
                {(user ? UserNavItems : PublicNavItems).map((item) => item.children ? (
                  <DropdownMenu.Group key={item.label}>
                    <DropdownMenu.Label className="px-3 pb-1 pt-4 text-[10px] font-semibold uppercase tracking-widest text-neutral-500">{item.label}</DropdownMenu.Label>
                    {item.children.map((child) => <DropdownMenu.Item key={child.label} asChild><a href={child.href} target="_blank" rel="noreferrer" className={menuItem}>{child.label}<ArrowUpRight className="ml-auto h-3.5 w-3.5 text-neutral-500" /></a></DropdownMenu.Item>)}
                  </DropdownMenu.Group>
                ) : (
                  <DropdownMenu.Item key={item.path} asChild><Link to={item.path!} aria-current={pathname === item.path ? "page" : undefined} className={`${menuItem} ${pathname === item.path ? "bg-amber-300/10 text-amber-200" : ""}`}>{item.label}</Link></DropdownMenu.Item>
                ))}
                <DropdownMenu.Separator className="my-2 h-px bg-white/10" />
                {user ? <>
                  <DropdownMenu.Item asChild><Link to="/profile" className={menuItem}><UserRound className="h-4 w-4" />My profile</Link></DropdownMenu.Item>
                  <DropdownMenu.Item onSelect={onLogout} className={`${menuItem} text-rose-300 focus:bg-rose-400/10 focus:text-rose-200`}><LogOut className="h-4 w-4" />Sign out</DropdownMenu.Item>
                </> : <DropdownMenu.Item asChild><Link to="/register" className={`${menuItem} justify-between bg-amber-400 font-semibold text-neutral-950 focus:bg-amber-300 focus:text-neutral-950`}>Activate your account<Zap className="h-4 w-4" /></Link></DropdownMenu.Item>}
              </DropdownMenu.Content>
            </DropdownMenu.Portal>
          </DropdownMenu.Root>
        </div>
      </div>
      <div aria-hidden="true" className="h-px bg-gradient-to-r from-amber-400/60 via-amber-200/15 to-transparent" />
    </div>
  );
}
