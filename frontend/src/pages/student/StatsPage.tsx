import { useApi } from "../../services/queries";
import StudentCompetitions from "../../components/dashboard/StudentCompetitions";
import {
  StudentFrame,
  HouseStandings,
} from "../../components/dashboard/LivePortal";
import type { StudentSummary } from "../../components/dashboard/LivePortal";
import { Panel, Loading, Notice } from "../../components/admin/ConsoleUI";
export default function StatsPage() {
  const query = useApi<StudentSummary>("/portal/summary/");
  return (
    <StudentFrame>
      <header>
        <p className="text-sm text-amber-300">Every participation matters</p>
        <h1 className="mt-2 text-3xl font-semibold text-white">Leaderboard</h1>
        <p className="mt-2 text-sm text-neutral-400">
          Live house standings from approved points. Reversed awards are
          excluded.
        </p>
      </header>
      {query.isPending ? (
        <Loading />
      ) : query.isError ? (
        <Notice error={query.error} retry={() => void query.refetch()} />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4">
            <Panel>
              <p className="text-sm text-neutral-400">Your merit points</p>
              <p className="mt-3 text-3xl font-semibold text-amber-300">
                {query.data.points.toLocaleString()}
              </p>
            </Panel>
            <Panel>
              <p className="text-sm text-neutral-400">Your student rank</p>
              <p className="mt-3 text-3xl font-semibold text-white">
                #{query.data.rank}
              </p>
              <p className="mt-2 text-xs text-neutral-500">
                Equal point totals share the same rank.
              </p>
            </Panel>
          </div>
          <HouseStandings houses={query.data.houses} />
          <StudentCompetitions />
        </>
      )}
    </StudentFrame>
  );
}
