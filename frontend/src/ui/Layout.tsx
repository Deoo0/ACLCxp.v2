import React, { useState } from 'react';
import { Link, Outlet } from 'react-router-dom';
import { FiMenu, FiSearch, FiBell, FiSun, FiMoon } from 'react-icons/fi';
import { useTheme } from './ThemeProvider';
import { Button } from './Button';

export const Layout: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  const [collapsed, setCollapsed] = useState(false);
  const { theme, toggle } = useTheme();

  return (
    <div className="min-h-screen flex bg-[var(--bg)] text-[var(--text)]">
      <aside className={`transition-all duration-300 bg-[var(--color-surface)] border-r border-[var(--card-border)] ${collapsed ? 'w-18' : 'w-72'} p-4 flex flex-col gap-6`}> 
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-md bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-secondary)] flex items-center justify-center text-white font-bold">AC</div>
            {!collapsed && <div className="text-lg font-semibold">ACLCxp</div>}
          </div>
          <button aria-label="Toggle sidebar" onClick={() => setCollapsed((s) => !s)} className="p-2 rounded-md hover:bg-[var(--glass)]">
            <FiMenu />
          </button>
        </div>

        <nav className="flex-1">
          <ul className="flex flex-col gap-2">
            <li>
              <Link to="/student/dashboard" className="flex items-center gap-3 p-2 rounded-md hover:bg-[var(--glass)]">
                <span className="w-8 h-8 rounded-md bg-[var(--primary-50)] flex items-center justify-center text-[var(--primary)]">S</span>
                {!collapsed && <span>Student Dashboard</span>}
              </Link>
            </li>
            <li>
              <Link to="/organizer" className="flex items-center gap-3 p-2 rounded-md hover:bg-[var(--glass)]">
                <span className="w-8 h-8 rounded-md bg-[var(--primary-50)] flex items-center justify-center text-[var(--primary)]">O</span>
                {!collapsed && <span>Organizer</span>}
              </Link>
            </li>
            <li>
              <Link to="/admin" className="flex items-center gap-3 p-2 rounded-md hover:bg-[var(--glass)]">
                <span className="w-8 h-8 rounded-md bg-[var(--primary-50)] flex items-center justify-center text-[var(--primary)]">A</span>
                {!collapsed && <span>Admin</span>}
              </Link>
            </li>
          </ul>
        </nav>

        <div className="mt-auto">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={toggle} aria-label="Toggle theme">
              {theme === 'dark' ? <FiSun /> : <FiMoon />}
              <span className="ml-2 text-xs">{theme === 'dark' ? 'Light' : 'Dark'}</span>
            </Button>
          </div>
        </div>
      </aside>

      <div className="flex-1 p-6">
        <header className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="relative">
              <input className="pl-10 pr-4 py-2 rounded-lg bg-[var(--color-surface)] border border-[var(--card-border)]" placeholder="Search events, people..." />
              <FiSearch className="absolute left-3 top-2.5 text-[var(--muted)]" />
            </div>
            <div className="hidden md:flex items-center gap-3">
              <Button variant="secondary" size="sm">Create Event</Button>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button className="p-2 rounded-md hover:bg-[var(--glass)]"><FiBell /></button>
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[var(--color-secondary)] to-[var(--color-primary)] flex items-center justify-center text-white">L</div>
          </div>
        </header>

        <main>
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;
