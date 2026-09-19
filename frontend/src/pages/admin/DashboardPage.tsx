import { Link } from "react-router-dom";
import {
  Users,
  CalendarDays,
  ScanLine,
  Trophy,
  ArrowRight,
} from "lucide-react";
import { useApi } from "../../services/queries";
import type { Row } from "../../services/queries";
import {
  PageHeading,
  Panel,
  Loading,
  Notice,
  button,
} from "../../components/admin/ConsoleUI";
interface Overview {
  students: number;
  events: number;
  ongoing: number;
  registrations: number;
  attendance: number;
  points: number;
  houses: Row[];
  recent: Row[];
}
export default function DashboardPage() {
  const query = useApi<Overview>("/admin/dashboard/");
  if (query.isPending) return <Loading />;
  if (query.isError)
    return <Notice error={query.error} retry={() => void query.refetch()} />;
  const data = query.data;
  return (
    <div className="space-y-6">
      <PageHeading
        title="Campus overview"
        description="Live records across students, events and house competition. Changes refresh automatically while this page is open."
      />
      <section className="relative overflow-hidden rounded-2xl border border-amber-400/15 bg-gradient-to-br from-amber-400/10 via-neutral-900 to-neutral-900 p-6 sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-[.18em] text-amber-300">
          Operations center
        </p>
        <h2 className="mt-3 text-2xl font-semibold text-white">
          Keep every participation counted.
        </h2>
        <p className="mt-2 text-sm text-neutral-400">
          {data.ongoing} ongoing events / {data.registrations} active
          registration records
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link className={button} to="/admin/events">
            Manage events
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link className={button} to="/admin/attendance">
            Open check-in
            <ScanLine className="h-4 w-4" />
          </Link>
        </div>
      </section>
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        {[
          ["Active students", data.students, Users],
          ["Campus events", data.events, CalendarDays],
          ["Valid attendance", data.attendance, ScanLine],
          ["Net awarded points", data.points, Trophy],
        ].map(([label, value, Icon]) => {
          const Symbol = Icon as typeof Users;
          return (
            <Panel key={String(label)}>
              <Symbol className="h-5 w-5 text-amber-400" />
              <p className="mt-5 text-3xl font-semibold text-white">
                {Number(value).toLocaleString()}
              </p>
              <p className="mt-2 text-xs text-neutral-500">{String(label)}</p>
            </Panel>
          );
        })}
      </div>
      <div className="grid gap-6 xl:grid-cols-2">
        <Panel>
          <h2 className="mb-5 font-semibold text-white">House standings</h2>
          <div className="space-y-4">
            {data.houses.map((house, index) => (
              <div className="flex items-center gap-3" key={house.id}>
                <span className="w-7 text-sm text-neutral-500">
                  {index + 1}
                </span>
                <span
                  className="h-3 w-3 rounded-full"
                  style={{ backgroundColor: String(house.color_code) }}
                />
                <span className="flex-1 text-sm text-neutral-300">
                  {String(house.name)}
                </span>
                <span className="font-semibold text-amber-300">
                  {Number(house.total_points).toLocaleString()}
                </span>
              </div>
            ))}
            {!data.houses.length && (
              <p className="text-sm text-neutral-500">
                Add houses to begin the competition.
              </p>
            )}
          </div>
        </Panel>
        <Panel>
          <div className="mb-4 flex justify-between">
            <h2 className="font-semibold text-white">Recent activity</h2>
            <Link to="/admin/audit-logs" className="text-xs text-amber-300">
              View audit trail
            </Link>
          </div>
          <div className="divide-y divide-white/5">
            {data.recent.map((row) => (
              <div key={row.id} className="py-3">
                <p className="break-words text-sm text-neutral-300">
                  {String(row.description)}
                </p>
                <p className="mt-1 text-xs text-neutral-500">
                  {String(row.user_email)} /{" "}
                  {new Date(String(row.created_at)).toLocaleString()}
                </p>
              </div>
            ))}
            {!data.recent.length && (
              <p className="text-sm text-neutral-500">
                Actions will appear here as records change.
              </p>
            )}
          </div>
        </Panel>
      </div>
    </div>
  );
}
