import StatCards from "../components/dashboard/StatCards";
import EventList from "../components/dashboard/EventList";
import Leaderboard from "../components/dashboard/Leaderboard";
import AuthenticatedLayout from "../components/layouts/AuthenticatedLayout";
import { useAuth } from "../context/AuthContext";

export default function DashboardPage() {
  const { user } = useAuth();

  return (
    <AuthenticatedLayout title="Dashboard">
      {/* Greeting */}
      <div className="mb-5">
        <p className="text-sm text-gray-400">Good morning,</p>
        <h1 className="text-xl font-bold text-gray-900">
          {user?.full_name ?? "Student"}
        </h1>
      </div>

      <StatCards />

      {/* Events */}
      <section className="mt-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold text-gray-900">
            Upcoming events
          </h2>
          <a
            href="/events"
            className="text-xs text-[#2E308E] hover:underline"
          >
            See all
          </a>
        </div>

        <EventList />
      </section>

      {/* Leaderboard */}
      <section className="mt-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold text-gray-900">
            Leaderboard
          </h2>
          <a
            href="/leaderboard"
            className="text-xs text-[#2E308E] hover:underline"
          >
            Full board
          </a>
        </div>

        <Leaderboard />
      </section>
    </AuthenticatedLayout>
  );
}