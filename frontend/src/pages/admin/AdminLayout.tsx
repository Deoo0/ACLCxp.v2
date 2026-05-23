// frontend/src/pages/admin/AdminLayout.tsx
import { useState } from "react";
import { Outlet, NavLink, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const AdminLayout = () => {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { user, logout, isLoading } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  if (isLoading || !user) return null;

  const navItems = [
    {label: "Dashboard", path: "/admin" },
    {label: "Users", path: "/admin/users" },
    {label: "Events", path: "/admin/events" },
    {label: "Houses", path: "/admin/houses" },
    {label: "Attendance", path: "/admin/attendance" },
    {label: "Points", path: "/admin/points" },
    {label: "Settings", path: "/admin/settings" },
    {label: "Audit Logs", path: "/admin/audit-logs" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-40 h-screen transition-transform ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} w-64`}
      >
        <div className="h-full px-3 py-4 overflow-y-auto bg-slate-900/95 backdrop-blur-xl border-r border-white/10">
          {/* Logo */}
          <div className="flex items-center gap-3 px-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center">
              <span className="text-xl font-bold text-white">A</span>
            </div>
            <div>
              <h1 className="text-lg font-bold text-white">ACLCxp</h1>
              <p className="text-xs text-slate-400">Admin Panel</p>
            </div>
          </div>

          {/* Navigation */}
          <nav className="space-y-1">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === "/admin"}
                className={({ isActive }) => {
                  const active =
                    item.path === "/admin"
                      ? location.pathname === "/admin" ||
                        location.pathname === "/admin/dashboard"
                      : isActive;

                  return `flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${
                    active
                      ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30"
                      : "text-slate-400 hover:text-white hover:bg-white/5"
                  }`;
                }}
              >
                {/* <span className="text-xl">{item.icon}</span> */}
                <span className="text-sm font-medium">{item.label}</span>
              </NavLink>
            ))}
          </nav>

          {/* User Profile */}
          <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-white/10">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center">
                <span className="text-sm font-bold text-white">
                  {user?.first_name?.[0]}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">
                  {user?.first_name} {user?.last_name}
                </p>
                <p className="text-xs text-slate-400">{user?.role}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="w-full px-3 py-2 text-sm font-medium text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className={`transition-all ${sidebarOpen ? "ml-64" : "ml-0"}`}>
        {/* Top Header */}
        <header className="sticky top-0 z-30 bg-slate-900/80 backdrop-blur-xl border-b border-white/10">
          <div className="px-4 py-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              </button>

              <div className="flex items-center gap-4">
                {/* Notifications */}
                <button className="relative p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors">
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                    />
                  </svg>
                  <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
