import { Link } from "react-router-dom";
import { ArrowUpRight, Shield, Sparkles, Trophy } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useApi } from "../../services/queries";
import type { StudentSummary } from "../../components/dashboard/LivePortal";
import { Loading, Notice } from "../../components/admin/ConsoleUI";
import { ExperienceCard, ExperienceFrame, ExperienceHeading, ExperienceStandings } from "../../components/dashboard/StudentExperience";
import StudentCompetitions from "../../components/dashboard/StudentCompetitions";

export default function StatsPage() {
  const { user } = useAuth();
  const query = useApi<StudentSummary>("/portal/summary/");
  return <ExperienceFrame>
    <ExperienceHeading eyebrow="Campus spirit / live standings" title="Every contribution counts." description="Follow your house, celebrate the competition, and see where your participation takes you."><a href="#competitions" className="xp-button">Competition board <ArrowUpRight size={17} /></a></ExperienceHeading>
    {query.isPending ? <Loading /> : query.isError ? <Notice error={query.error} retry={() => void query.refetch()} /> : <>
      <div className="grid gap-4 sm:grid-cols-3">
        <ExperienceCard><Sparkles size={21} className="text-amber-300" /><p className="mt-4 text-xs text-neutral-400">Your merit points</p><p className="mt-2 text-3xl font-semibold tabular-nums text-white">{query.data.points.toLocaleString()}</p><Link className="xp-text-link mt-2" to="/merit?view=points">See your points story <ArrowUpRight size={14} /></Link></ExperienceCard>
        <ExperienceCard><Trophy size={21} className="text-violet-300" /><p className="mt-4 text-xs text-neutral-400">Your student rank</p><p className="mt-2 text-3xl font-semibold tabular-nums text-white">{query.data.rank > 0 ? `#${query.data.rank}` : "Unranked"}</p><p className="mt-4 text-xs leading-5 text-neutral-400">Equal point totals share the same rank.</p></ExperienceCard>
        <ExperienceCard><Shield size={21} className="text-emerald-300" /><p className="mt-4 text-xs text-neutral-400">Your house</p><p className="mt-2 break-words text-2xl font-semibold text-white">{user?.house_name || "Not assigned yet"}</p><p className="mt-4 text-xs leading-5 text-neutral-400">{user?.house_name ? "Get involved and cheer on your house." : "Your school will assign your house."}</p></ExperienceCard>
      </div>
      <ExperienceStandings houses={query.data.houses} houseName={user?.house_name} interactive />
      <details className="xp-card"><summary className="cursor-pointer text-sm font-medium text-neutral-200">How do the standings work?</summary><p className="mt-4 max-w-3xl text-sm leading-6 text-neutral-400">House standings use approved house points. Your personal merit total and student rank are separate records. Equal totals share a rank, and reversed awards are excluded. Check your points history for the details of your own awards.</p><Link to="/merit?view=points" className="xp-text-link mt-2">View my points history →</Link></details>
      <StudentCompetitions />
    </>}
  </ExperienceFrame>;
}
