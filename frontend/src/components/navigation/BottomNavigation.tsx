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
  /** Exactly 4 items — rendered as 2 on the left, 2 on the right of the center action. */
  items: [BottomNavItem, BottomNavItem, BottomNavItem, BottomNavItem];
  /** The elevated circular button in the middle of the bar. */
  centerAction: BottomNavCenterAction;
  /** Light variant for pages with a light surface. Defaults to the app's dark theme. */
  variant?: "dark" | "light";
}

/**
 * Floating pill-style bottom navigation for mobile, styled to match the
 * existing arcade theme (font-arcade, #D91B22 red, yellow active accent).
 * The center action sits above the bar as an elevated circular button,
 * matching the "notch" bottom-nav pattern.
 *
 * Usage:
 *   <BottomNavigation
 *     items={[
 *       { label: "Home", path: "/", icon: HiHome },
 *       { label: "Ranks", path: "/leaderboard", icon: HiChartBar },
 *       { label: "Rewards", path: "/rewards", icon: HiGift },
 *       { label: "Profile", path: "/profile", icon: HiUser },
 *     ]}
 *     centerAction={{ label: "Play", icon: HiLightningBolt, path: "/play" }}
 *   />
 *
 * Render once near the root of your mobile layout (e.g. alongside
 * <MobileDrawer />), and add `pb-24` (or similar) to your page content so
 * the fixed bar never overlaps it.
 */
export default function BottomNavigation({ items, centerAction, variant = "dark" }: BottomNavigationProps) {
  const location = useLocation();
  const isDark = variant === "dark";
  const [left, right] = [items.slice(0, 2), items.slice(2, 4)];

  const barBg = isDark ? "bg-[#1E1E1E]" : "bg-white";
  const barBorder = isDark ? "border-white/10" : "border-black/10";
  const inactiveText = isDark ? "text-white/45" : "text-black/40";
  const activeText = "text-yellow-400";
  const centerRing = isDark ? "border-[#1E1E1E]" : "border-white";

  const isActive = (path: string) => (path === "/" ? location.pathname === "/" : location.pathname.startsWith(path));

  const handleCenterClick = () => {
    centerAction.onClick?.();
  };

  const NavButton = ({ item }: { item: BottomNavItem }) => {
    const active = isActive(item.path);
    const Icon = item.icon;
    return (
      <NavLink
        to={item.path}
        className="relative flex flex-col items-center gap-1 px-3 py-1.5 outline-none"
        aria-current={active ? "page" : undefined}
      >
        {active && <span className="absolute -top-1 h-1 w-1 rounded-full bg-yellow-400" aria-hidden="true" />}
        <Icon
          className={`h-5 w-5 transition-colors duration-200 ${active ? activeText : inactiveText}`}
          aria-hidden="true"
        />
        <span
          className={`font-arcade text-[9px] uppercase tracking-wide transition-colors duration-200 ${
            active ? activeText : inactiveText
          }`}
        >
          {item.label}
        </span>
      </NavLink>
    );
  };

  const CenterIcon = centerAction.icon;
  const centerButtonClasses = `flex h-14 w-14 items-center justify-center rounded-full border-4 ${centerRing} bg-gradient-to-br from-[#E23138] to-[#8f1015] shadow-[0_8px_20px_rgba(217,27,34,0.45)] transition-transform duration-150 active:scale-90`;

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 flex justify-center pb-[calc(env(safe-area-inset-bottom)+12px)] px-4 sm:hidden"
      aria-label="Primary"
    >
      <div className={`relative flex w-full max-w-sm items-center justify-between rounded-full border px-3 py-2.5 ${barBg} ${barBorder}`}>
        <div className="flex items-center gap-1">
          {left.map((item) => (
            <NavButton key={item.path} item={item} />
          ))}
        </div>

        {/* Center action — elevated above the bar */}
        <div className="absolute left-1/2 -top-6 -translate-x-1/2">
          {centerAction.path ? (
            <NavLink to={centerAction.path} aria-label={centerAction.label} className={centerButtonClasses}>
              <CenterIcon className="h-6 w-6 text-white" aria-hidden="true" />
            </NavLink>
          ) : (
            <button type="button" onClick={handleCenterClick} aria-label={centerAction.label} className={centerButtonClasses}>
              <CenterIcon className="h-6 w-6 text-white" aria-hidden="true" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-1">
          {right.map((item) => (
            <NavButton key={item.path} item={item} />
          ))}
        </div>
      </div>
    </nav>
  );
}