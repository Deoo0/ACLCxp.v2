import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import StatCards from "../components/dashboard/StatCards";
import EventList from "../components/dashboard/EventList";
import Leaderboard from "../components/dashboard/Leaderboard";
import BottomNav from "../components/layouts/BottomNav";

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

const initials = `${user?.first_name?.[0] ?? ""}${user?.last_name?.[0] ?? ""}`.toUpperCase();

  return (
    <div className="min-h-screen bg-gray-50 pb-20">

      <header className="bg-[#2E308E] px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center text-[#2E308E] font-bold text-xs">
            XP
          </div>
          <span className="text-white font-bold text-base tracking-wide">
            ACLC<span className="text-[#D91B22]">xp</span>
          </span>
        </div>

        <div className="flex items-center gap-3">
          <button aria-label="Notifications" className="text-white/70 hover:text-white transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 10-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
          </button>

          <div className="w-8 h-8 rounded-full bg-indigo-400 flex items-center justify-center text-white text-xs font-semibold">
            {initials}
          </div>

          <button
            onClick={handleLogout}
            aria-label="Logout"
            className="text-white/70 hover:text-white transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h6a2 2 0 012 2v1" />
            </svg>
          </button>
        </div>
      </header>

      <main className="px-4 pt-5 max-w-2xl mx-auto">
        <div className="mb-5">
          <p className="text-sm text-gray-400">Good morning,</p>
          <h1 className="text-xl font-bold text-gray-900">{user?.full_name ?? "Student"}</h1>
        </div>

        <StatCards />

        <section className="mt-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-semibold text-gray-900">Upcoming events</h2>
            <a href="/events" className="text-xs text-[#2E308E] hover:underline">See all</a>
          </div>
          <EventList />
        </section>

        <section className="mt-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-semibold text-gray-900">Leaderboard</h2>
            <a href="/leaderboard" className="text-xs text-[#2E308E] hover:underline">Full board</a>
          </div>
          <Leaderboard />
        </section>
      </main>

      <BottomNav active="home" />
    </div>
  );
}