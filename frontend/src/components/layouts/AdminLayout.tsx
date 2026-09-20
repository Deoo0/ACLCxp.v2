import { useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import * as Dialog from "@radix-ui/react-dialog";
import {
  LayoutDashboard,
  Users,
  CalendarDays,
  Shield,
  ScanLine,
  Trophy,
  Swords,
  Settings,
  ScrollText,
  Menu,
  X,
  LogOut,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import PageTransition from "../feedback/PageTransition";
import { button } from "../admin/ConsoleUI";

const links = [
  { label: "Overview", path: "/admin", icon: LayoutDashboard },
  { label: "Students & access", path: "/admin/users", icon: Users },
  { label: "Events", path: "/admin/events", icon: CalendarDays },
  { label: "Houses", path: "/admin/houses", icon: Shield },
  { label: "Matchups & Results", path: "/admin/matchups", icon: Swords },
  { label: "Attendance", path: "/admin/attendance", icon: ScanLine },
  { label: "Points & results", path: "/admin/points", icon: Trophy },
  { label: "Portal settings", path: "/admin/settings", icon: Settings },
  { label: "Audit trail", path: "/admin/audit-logs", icon: ScrollText },
];
export default function AdminLayout() {
  const [open, setOpen] = useState(false);
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const navigation = (
    <>
      <div className="flex items-center gap-3 px-3 py-6">
        <img
          src="/aclcxp-logo.png"
          className="h-11 w-11 object-contain"
          alt=""
        />
        <div>
          <p className="text-lg font-bold text-white">
            ACLC<span className="text-amber-400">xp</span>
          </p>
          <p className="text-[10px] uppercase tracking-[.18em] text-neutral-500">
            Admin console
          </p>
        </div>
      </div>
      <nav aria-label="Admin navigation" className="flex-1 space-y-1">
        {links.map(({ label, path, icon: Icon }) => (
          <NavLink
            key={path}
            to={path}
            end={path === "/admin"}
            onClick={() => setOpen(false)}
            className={({ isActive }) =>
              `flex min-h-12 items-center gap-3 rounded-xl px-3 text-sm font-medium outline-none transition focus-visible:ring-2 focus-visible:ring-amber-400 ${isActive || (path === "/admin" && location.pathname === "/admin/dashboard") ? "border border-amber-400/15 bg-amber-400/10 text-amber-300" : "border border-transparent text-neutral-400 hover:bg-white/5 hover:text-white"}`
            }
          >
            <Icon className="h-4 w-4" />
            {label}
          </NavLink>
        ))}
      </nav>
      <div className="mt-8 border-t border-white/10 p-3">
        <p className="truncate text-sm font-medium text-white">
          {user?.full_name || user?.first_name}
        </p>
        <p className="mt-1 text-xs text-neutral-500">School administrator</p>
        <button
          className={`${button} mt-4 w-full`}
          onClick={() =>
            void logout()
              .catch(() => {})
              .finally(() => navigate("/login", { replace: true }))
          }
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </button>
      </div>
    </>
  );
  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-200">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col overflow-y-auto border-r border-white/10 bg-neutral-900/50 px-3 lg:flex">
        {navigation}
      </aside>
      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 flex h-[74px] items-center justify-between gap-4 border-b border-white/10 bg-neutral-950/90 px-4 backdrop-blur-xl sm:px-8">
          <div className="flex items-center gap-3">
            <Dialog.Root open={open} onOpenChange={setOpen}>
              <Dialog.Trigger
                className={`${button} lg:hidden`}
                aria-label="Open admin navigation"
              >
                <Menu className="h-5 w-5" />
              </Dialog.Trigger>
              <Dialog.Portal>
                <Dialog.Overlay className="fixed inset-0 z-50 bg-black/70 lg:hidden" />
                <Dialog.Content className="fixed inset-y-0 left-0 z-[51] flex w-72 max-w-[90vw] flex-col overflow-y-auto bg-neutral-900 px-3 lg:hidden">
                  <Dialog.Title className="sr-only">
                    Admin navigation
                  </Dialog.Title>
                  <Dialog.Description className="sr-only">
                    Navigate campus management screens.
                  </Dialog.Description>
                  <Dialog.Close
                    aria-label="Close navigation"
                    className={`${button} absolute right-3 top-3`}
                  >
                    <X className="h-4 w-4" />
                  </Dialog.Close>
                  {navigation}
                </Dialog.Content>
              </Dialog.Portal>
            </Dialog.Root>
            <span className="text-sm font-medium text-neutral-300">
              Campus management
            </span>
          </div>
          <span className="flex items-center gap-2 rounded-full border border-amber-400/20 bg-amber-400/5 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-amber-300">
            <Shield className="h-3.5 w-3.5" />
            Administrator
          </span>
        </header>
        <main className="mx-auto max-w-[1500px] p-4 sm:p-8">
          <PageTransition />
        </main>
      </div>
    </div>
  );
}
