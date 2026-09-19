import { Link } from "react-router-dom";
import {
  ArrowRight,
  QrCode,
  Sparkles,
  CalendarCheck2,
  Trophy,
  CalendarDays,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useApi } from "../../services/queries";
import type { PageData, Row } from "../../services/queries";
import {
  StudentFrame,
  HouseStandings,
} from "../../components/dashboard/LivePortal";
import type { StudentSummary } from "../../components/dashboard/LivePortal";
import {
  Panel,
  Notice,
  Loading,
  button,
  primary,
} from "../../components/admin/ConsoleUI";
export default function DashboardPage() {
  const { user } = useAuth();
  const query = useApi<StudentSummary>("/portal/summary/");
  const events = useApi<PageData<Row>>("/events/?status=PUBLISHED&page_size=3");
  if (query.isPending)
    return (
      <StudentFrame>
        <Loading />
      </StudentFrame>
    );
  if (query.isError)
    return (
      <StudentFrame>
        <Notice error={query.error} retry={() => void query.refetch()} />
      </StudentFrame>
    );
  const data = query.data;
  const step = Number(data.settings.merit_milestone) || 300;
  const next = (Math.floor(Math.max(0, data.points) / step) + 1) * step;
  const progress = Math.max(
    0,
    Math.min(100, ((data.points % step) / step) * 100),
  );
  return (
    <StudentFrame>
      <header>
        <p className="text-sm text-neutral-400">
          Welcome back, {user?.first_name}
        </p>
        <h1 className="mt-1 text-2xl font-semibold text-white sm:text-3xl">
          Your student dashboard
        </h1>
      </header>
      {data.settings.announcement && (
        <Panel>
          <p className="text-xs font-semibold uppercase tracking-wider text-amber-300">
            Campus announcement
          </p>
          <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-neutral-300">
            {data.settings.announcement}
          </p>
        </Panel>
      )}
      <section className="relative overflow-hidden rounded-2xl border border-amber-400/15 bg-gradient-to-br from-amber-400/10 via-neutral-900 to-neutral-900 p-6 sm:p-8">
        <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-amber-300">
          <Sparkles className="h-4 w-4" />
          Your next level
        </p>
        <h2 className="mt-4 text-2xl font-semibold text-white">
          {next - data.points} points to your next milestone.
        </h2>
        <p className="mt-2 text-sm text-neutral-400">
          Join campus events, check in and build your merit record.
        </p>
        <div className="mt-5 h-2 overflow-hidden rounded-full bg-white/5">
          <div
            className="h-full rounded-full bg-amber-400 transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link className={primary} to="/events">
            Explore events
            <ArrowRight className="h-4 w-4" />
          </Link>
          <button
            className={button}
            onClick={() =>
              window.dispatchEvent(new Event("aclcxp:open-student-qr"))
            }
          >
            <QrCode className="h-4 w-4" />
            My event pass
          </button>
        </div>
      </section>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          ["Merit points", data.points, Sparkles],
          ["Events attended", data.attendance, CalendarCheck2],
          ["Registrations", data.registered, CalendarDays],
          ["Student rank", `#${data.rank}`, Trophy],
        ].map(([label, value, Icon]) => {
          const Symbol = Icon as typeof Trophy;
          return (
            <Panel key={String(label)}>
              <Symbol className="h-5 w-5 text-amber-400" />
              <p className="mt-4 text-2xl font-semibold text-white">
                {String(value)}
              </p>
              <p className="mt-1 text-xs text-neutral-500">{String(label)}</p>
            </Panel>
          );
        })}
      </div>
      <div className="grid gap-5 lg:grid-cols-2">
        <HouseStandings houses={data.houses} />
        <Panel>
          <div className="flex justify-between">
            <h2 className="font-semibold text-white">Discover events</h2>
            <Link className="text-xs text-amber-300" to="/events">
              View all
            </Link>
          </div>
          {events.isPending ? (
            <Loading />
          ) : events.isError ? (
            <Notice error={events.error} />
          ) : (
            <div className="mt-4 space-y-3">
              {events.data.data.map((event) => (
                <Link
                  key={event.id}
                  to="/events"
                  className="block rounded-xl border border-white/5 p-4 transition hover:border-amber-400/20"
                >
                  <p className="text-sm font-medium text-neutral-200">
                    {String(event.title)}
                  </p>
                  <p className="mt-2 text-xs text-neutral-500">
                    {String(event.event_date)} / {String(event.venue)}
                  </p>
                </Link>
              ))}
              {!events.data.data.length && (
                <p className="mt-5 text-sm text-neutral-500">
                  No published events yet. Check back after your school posts
                  one.
                </p>
              )}
            </div>
          )}
        </Panel>
      </div>
    </StudentFrame>
  );
}
