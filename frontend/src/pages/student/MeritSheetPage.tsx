import { useState } from "react";
import {
  RefreshCw, Star, Shield, CalendarCheck, Medal, Sparkles, Flag, Users, Trophy, Crown,
  CalendarCheck2, TrendingUp, Lock, CheckCircle2, ArrowRight, AlertTriangle,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Mock data — mirrors the MeritSheetData contract used in the app   */
/* ------------------------------------------------------------------ */

const HOUSES = {
  CAHEL: { name: "CAHEL", motto: "From ashes we rise", color: "#FF6B35" },
  GIALLIO: { name: "GIALLIO", motto: "Courage above all", color: "#FFD700" },
  VIERRDY: { name: "VIERRDY", motto: "Strength through fire", color: "#DC143C" },
  ROXXO: { name: "ROXXO", motto: "Wisdom and strength", color: "#4169E1" },
  AZUL: { name: "AZUL", motto: "Beyond the horizon", color: "#9370DB" },
};

const mockData = {
  summary: {
    totalPoints: 245,
    semester: "AY 2025–2026, 1st Semester",
    nextMilestone: 300,
    previousMilestone: 200,
    lastUpdated: new Date().toISOString(),
  },
  student: {
    name: "Lawrence Deo",
    program: "BS Information Technology",
    yearLevel: "4th Year",
    house: HOUSES.CAHEL,
    houseContribution: 125,
    housePosition: 12,
    houseMemberCount: 214,
  },
  breakdown: [
    { category: "participation", label: "Participation", count: 18, countLabel: "events attended", points: 90, shareOfTotal: 90 / 245, color: "#38BDF8", icon: CalendarCheck },
    { category: "competition", label: "Competition", count: 3, countLabel: "competitions", points: 120, shareOfTotal: 120 / 245, color: "#F5B300", icon: Medal },
    { category: "achievement", label: "Other Achievements", count: 7, countLabel: "achievements", points: 35, shareOfTotal: 35 / 245, color: "#A78BFA", icon: Sparkles },
  ],
  activity: [
    { id: "1", date: "2026-08-14", activity: "ACLC Week Opening 2026", eventCategory: "Technology", type: "participation", typeLabel: "Participation", points: 5 },
    { id: "2", date: "2026-08-12", activity: "Skills Competition (Java)", eventCategory: "Competition", type: "2nd", typeLabel: "2nd Place", points: 40 },
    { id: "3", date: "2026-08-10", activity: "Cyber Security Seminar", eventCategory: "Seminar", type: "participation", typeLabel: "Participation", points: 5 },
    { id: "4", date: "2026-08-06", activity: "Hackathon", eventCategory: "Competition", type: "1st", typeLabel: "1st Place", points: 50 },
    { id: "5", date: "2026-07-30", activity: "Valorant Finals", eventCategory: "Sports", type: "participation", typeLabel: "Participation", points: 5 },
    { id: "6", date: "2026-07-22", activity: "Feet Republic", eventCategory: "Competition", type: "3rd", typeLabel: "3rd Place", points: 30 },
  ],
  attendance: { eventsAttended: 18, eventsRegistered: 22, attendanceRate: 18 / 22, participationPoints: 90, eventsMissed: 4 },
  achievements: [
    { id: "1", title: "First Event", description: "Attend your very first ACLCxp event.", icon: Flag, unlocked: true },
    { id: "2", title: "Event Regular", description: "Attend 15+ events in a semester.", icon: Users, unlocked: true },
    { id: "3", title: "Competition Winner", description: "Place 1st, 2nd, or 3rd in any competition.", icon: Trophy, unlocked: true },
    { id: "4", title: "House Champion", description: "Finish top 5 in your house's standings.", icon: Crown, unlocked: false, progress: { current: 12, target: 5 } },
    { id: "5", title: "Perfect Attendance", description: "Attend every event you register for.", icon: CalendarCheck2, unlocked: false, progress: { current: 18, target: 22 } },
    { id: "6", title: "Rising Star", description: "Earn 100 points in a single month.", icon: TrendingUp, unlocked: false, progress: { current: 65, target: 100 } },
  ],
  leaderboard: {
    currentUserRank: 12,
    totalRanked: 214,
    nearby: [
      { rank: 10, name: "Krisha Bermudez", points: 265, isCurrentUser: false },
      { rank: 11, name: "Adrian Villafuerte", points: 252, isCurrentUser: false },
      { rank: 12, name: "Lawrence Deo", points: 245, isCurrentUser: true },
      { rank: 13, name: "Mikaela Suarez", points: 238, isCurrentUser: false },
    ],
  },
};

/* ------------------------------------------------------------------ */
/*  Small shared bits                                                  */
/* ------------------------------------------------------------------ */

function CircularProgress({ progress, size = 168, strokeWidth = 9, children }) {
  const clamped = Math.min(1, Math.max(0, progress));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - clamped);
  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={strokeWidth} />
        <circle
          cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#F5B300" strokeWidth={strokeWidth}
          strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 700ms cubic-bezier(0.4,0,0.2,1)" }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">{children}</div>
    </div>
  );
}

const TYPE_STYLES = {
  participation: "bg-sky-400/10 text-sky-300 ring-sky-400/20",
  "1st": "bg-amber-400/10 text-amber-300 ring-amber-400/20",
  "2nd": "bg-neutral-300/10 text-neutral-200 ring-neutral-300/20",
  "3rd": "bg-orange-400/10 text-orange-300 ring-orange-400/20",
};

function formatDate(iso) {
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "2-digit" });
}

/* ------------------------------------------------------------------ */
/*  Sections                                                           */
/* ------------------------------------------------------------------ */

function Header({ semester, isRefreshing, onRefresh }) {
  return (
    <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-neutral-50 sm:text-3xl">My Merit Sheet</h1>
        <p className="mt-1 text-sm text-neutral-400">Track your participation, achievements, and house contributions.</p>
      </div>
      <div className="flex items-center gap-3">
        <span className="hidden items-center gap-1.5 text-xs text-neutral-500 sm:inline-flex">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
          Up to date
        </span>
        <select defaultValue={semester} className="rounded-lg border border-white/10 bg-neutral-900 px-3 py-2 text-sm text-neutral-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400">
          <option value={semester}>{semester}</option>
        </select>
        <button
          type="button" onClick={onRefresh} disabled={isRefreshing}
          className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-neutral-900 px-3 py-2 text-sm font-medium text-neutral-300 transition hover:bg-neutral-800 hover:text-neutral-100 disabled:opacity-60"
        >
          <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
          <span className="hidden sm:inline">Refresh</span>
        </button>
      </div>
    </header>
  );
}

function MeritOverviewCard({ summary, houseColor }) {
  const { totalPoints, semester, nextMilestone, previousMilestone } = summary;
  const range = Math.max(1, nextMilestone - previousMilestone);
  const progress = Math.min(1, Math.max(0, (totalPoints - previousMilestone) / range));
  const remaining = Math.max(0, nextMilestone - totalPoints);
  return (
    <section className="relative overflow-hidden rounded-2xl border border-white/10 bg-neutral-900/60 p-6 sm:p-8">
      <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full opacity-20 blur-3xl" style={{ backgroundColor: houseColor }} />
      <div className="relative flex flex-col items-center gap-6 sm:flex-row sm:justify-between">
        <div className="text-center sm:text-left">
          <h2 className="text-xs font-medium uppercase tracking-widest text-neutral-500">{semester}</h2>
          <p className="mt-3 text-6xl font-semibold tabular-nums tracking-tight text-neutral-50 sm:text-7xl">{totalPoints}</p>
          <p className="mt-1 text-sm font-medium uppercase tracking-wide text-amber-400">Merit Points</p>
          <p className="mt-5 text-sm text-neutral-400">
            {remaining > 0 ? (
              <><span className="font-medium text-neutral-200">{remaining} pts</span> to your next milestone of <span className="font-medium text-neutral-200">{nextMilestone} pts</span></>
            ) : (
              <span className="font-medium text-emerald-400">Milestone reached</span>
            )}
          </p>
        </div>
        <CircularProgress progress={progress}>
          <div className="flex flex-col items-center justify-center rounded-full bg-neutral-950/60 p-6 text-center">
            <Star className="h-6 w-6 text-amber-400" fill="currentColor" strokeWidth={0} />
            <span className="mt-1 text-lg font-semibold tabular-nums text-neutral-100">{Math.round(progress * 100)}%</span>
            <span className="text-[11px] text-neutral-500">to {nextMilestone}</span>
          </div>
        </CircularProgress>
      </div>
      <div className="relative mt-6">
        <div className="h-2 w-full overflow-hidden rounded-full bg-white/5">
          <div className="h-full rounded-full bg-gradient-to-r from-amber-500 to-amber-300 transition-[width] duration-700 ease-out" style={{ width: `${progress * 100}%` }} />
        </div>
        <div className="mt-1.5 flex justify-between text-[11px] text-neutral-500">
          <span>{previousMilestone} pts</span>
          <span>{nextMilestone} pts</span>
        </div>
      </div>
    </section>
  );
}

function StudentHouseCard({ student }) {
  const { name, program, yearLevel, house, houseContribution, housePosition, houseMemberCount } = student;
  return (
    <section className="h-full rounded-2xl border border-white/10 bg-neutral-900/60 p-6">
      <h2 className="text-sm font-medium text-neutral-300">Student &amp; House</h2>
      <div className="mt-4 flex items-center gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-sm font-semibold text-neutral-950" style={{ backgroundColor: house.color }}>
          {name.split(" ").map((p) => p[0]).slice(0, 2).join("")}
        </div>
        <div className="min-w-0">
          <p className="truncate text-base font-semibold text-neutral-50">{name}</p>
          <p className="truncate text-xs text-neutral-500">{program} &middot; {yearLevel}</p>
        </div>
      </div>
      <div className="mt-5 flex items-center gap-3 rounded-xl border p-4" style={{ borderColor: `${house.color}33`, backgroundColor: `${house.color}14` }}>
        <Shield className="h-5 w-5 shrink-0" style={{ color: house.color }} />
        <div className="min-w-0">
          <p className="text-sm font-semibold" style={{ color: house.color }}>House {house.name}</p>
          <p className="text-xs italic text-neutral-400">&ldquo;{house.motto}&rdquo;</p>
        </div>
      </div>
      <dl className="mt-5 grid grid-cols-2 gap-4">
        <div>
          <dt className="text-xs text-neutral-500">House contribution</dt>
          <dd className="mt-0.5 text-lg font-semibold tabular-nums text-neutral-100">{houseContribution} pts</dd>
        </div>
        <div>
          <dt className="text-xs text-neutral-500">Position in house</dt>
          <dd className="mt-0.5 text-lg font-semibold tabular-nums text-neutral-100">#{housePosition}<span className="ml-1 text-xs font-normal text-neutral-500">of {houseMemberCount}</span></dd>
        </div>
      </dl>
    </section>
  );
}

function MeritBreakdown({ entries }) {
  return (
    <section className="h-full rounded-2xl border border-white/10 bg-neutral-900/60 p-6">
      <h2 className="text-sm font-medium text-neutral-300">Merit Breakdown</h2>
      <p className="mt-1 text-xs text-neutral-500">Where your points came from this semester.</p>
      <div className="mt-5 grid gap-4 sm:grid-cols-3">
        {entries.map((entry) => {
          const Icon = entry.icon;
          return (
            <div key={entry.category} className="rounded-xl border border-white/5 bg-neutral-950/40 p-4">
              <div className="flex items-center gap-2">
                <Icon className="h-4 w-4" style={{ color: entry.color }} />
                <span className="text-sm font-medium text-neutral-200">{entry.label}</span>
              </div>
              <p className="mt-3 text-2xl font-semibold tabular-nums text-neutral-50">{entry.points} pts</p>
              <p className="text-xs text-neutral-500">{entry.count} {entry.countLabel}</p>
              <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-white/5">
                <div className="h-full rounded-full transition-[width] duration-500" style={{ width: `${entry.shareOfTotal * 100}%`, backgroundColor: entry.color }} />
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function RecentMeritActivity({ activity }) {
  return (
    <section className="rounded-2xl border border-white/10 bg-neutral-900/60 p-6">
      <h2 className="text-sm font-medium text-neutral-300">Recent Merit Activity</h2>
      <p className="mt-1 text-xs text-neutral-500">Your latest point-earning activity.</p>
      <div className="mt-4 hidden overflow-hidden rounded-xl border border-white/5 sm:block">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-white/5 bg-white/[0.02] text-xs uppercase tracking-wide text-neutral-500">
              <th className="px-4 py-3 font-medium">Date</th>
              <th className="px-4 py-3 font-medium">Activity</th>
              <th className="px-4 py-3 font-medium">Type</th>
              <th className="px-4 py-3 text-right font-medium">Points</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {activity.map((r) => (
              <tr key={r.id} className="transition hover:bg-white/[0.02]">
                <td className="whitespace-nowrap px-4 py-3 text-neutral-400">{formatDate(r.date)}</td>
                <td className="px-4 py-3">
                  <p className="font-medium text-neutral-100">{r.activity}</p>
                  <p className="text-xs text-neutral-500">{r.eventCategory}</p>
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${TYPE_STYLES[r.type]}`}>{r.typeLabel}</span>
                </td>
                <td className="px-4 py-3 text-right font-semibold tabular-nums text-emerald-400">+{r.points}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <ol className="mt-4 space-y-3 sm:hidden">
        {activity.map((r) => (
          <li key={r.id} className="rounded-xl border border-white/5 bg-neutral-950/40 p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-neutral-100">{r.activity}</p>
                <p className="text-xs text-neutral-500">{formatDate(r.date)} &middot; {r.eventCategory}</p>
              </div>
              <span className="shrink-0 font-semibold tabular-nums text-emerald-400">+{r.points}</span>
            </div>
            <div className="mt-2">
              <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${TYPE_STYLES[r.type]}`}>{r.typeLabel}</span>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}

function AttendanceOverview({ attendance }) {
  const { eventsAttended, eventsRegistered, attendanceRate, participationPoints, eventsMissed } = attendance;
  const ratePercent = Math.round(attendanceRate * 100);
  const stats = [
    { label: "Attendance", value: `${eventsAttended} / ${eventsRegistered}` },
    { label: "Attendance rate", value: `${ratePercent}%` },
    { label: "Participation points", value: `${participationPoints} pts` },
    { label: "Missed events", value: `${eventsMissed}` },
  ];
  return (
    <section className="rounded-2xl border border-white/10 bg-neutral-900/60 p-6">
      <h2 className="text-sm font-medium text-neutral-300">Attendance Overview</h2>
      <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-xl border border-white/5 bg-neutral-950/40 p-4 text-center sm:text-left">
            <p className="text-xl font-semibold tabular-nums text-neutral-50">{s.value}</p>
            <p className="mt-0.5 text-xs text-neutral-500">{s.label}</p>
          </div>
        ))}
      </div>
      <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-white/5">
        <div className="h-full rounded-full bg-gradient-to-r from-sky-500 to-sky-300 transition-[width] duration-500" style={{ width: `${ratePercent}%` }} />
      </div>
    </section>
  );
}

function AchievementGrid({ achievements }) {
  return (
    <section className="rounded-2xl border border-white/10 bg-neutral-900/60 p-6">
      <div className="flex items-baseline justify-between">
        <h2 className="text-sm font-medium text-neutral-300">Achievements</h2>
        <span className="text-xs text-neutral-500">{achievements.filter((a) => a.unlocked).length} / {achievements.length} unlocked</span>
      </div>
      <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
        {achievements.map((a) => {
          const Icon = a.icon;
          return (
            <li key={a.id} className={`relative rounded-xl border p-4 text-center transition ${a.unlocked ? "border-amber-400/20 bg-amber-400/[0.06] hover:bg-amber-400/[0.1]" : "border-white/5 bg-neutral-950/40"}`}>
              <div className={`mx-auto flex h-11 w-11 items-center justify-center rounded-full ${a.unlocked ? "bg-amber-400/15 text-amber-300" : "bg-white/5 text-neutral-600"}`}>
                {a.unlocked ? <Icon className="h-5 w-5" /> : <Lock className="h-4 w-4" />}
              </div>
              <p className={`mt-2.5 text-sm font-medium ${a.unlocked ? "text-neutral-100" : "text-neutral-400"}`}>{a.title}</p>
              <p className="mt-1 text-xs leading-snug text-neutral-500">{a.description}</p>
              {!a.unlocked && a.progress && (
                <p className="mt-2 text-[11px] font-medium text-neutral-500">{a.progress.current} / {a.progress.target}</p>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function NextMilestoneCard({ summary }) {
  const { totalPoints, nextMilestone, previousMilestone } = summary;
  const remaining = Math.max(0, nextMilestone - totalPoints);
  const range = Math.max(1, nextMilestone - previousMilestone);
  const progressPercent = Math.round(Math.min(1, Math.max(0, (totalPoints - previousMilestone) / range)) * 100);
  const actions = ["Attend 3 more events", "Place in a competition", "Complete an eligible activity"];
  return (
    <section className="h-full rounded-2xl border border-white/10 bg-neutral-900/60 p-6">
      <h2 className="text-sm font-medium text-neutral-300">Next Milestone</h2>
      <p className="mt-2 text-2xl font-semibold tabular-nums text-neutral-50">{nextMilestone} Merit Points</p>
      <dl className="mt-3 flex gap-6 text-sm">
        <div><dt className="text-xs text-neutral-500">Current</dt><dd className="font-medium tabular-nums text-neutral-200">{totalPoints} pts</dd></div>
        <div><dt className="text-xs text-neutral-500">Remaining</dt><dd className="font-medium tabular-nums text-amber-400">{remaining} pts</dd></div>
        <div><dt className="text-xs text-neutral-500">Progress</dt><dd className="font-medium tabular-nums text-neutral-200">{progressPercent}%</dd></div>
      </dl>
      <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-white/5">
        <div className="h-full rounded-full bg-gradient-to-r from-amber-500 to-amber-300 transition-[width] duration-700" style={{ width: `${progressPercent}%` }} />
      </div>
      <p className="mt-5 text-xs font-medium uppercase tracking-wide text-neutral-500">Ways to get there</p>
      <ul className="mt-2 space-y-2">
        {actions.map((a) => (
          <li key={a} className="flex items-start gap-2 text-sm text-neutral-300">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
            {a}
          </li>
        ))}
      </ul>
    </section>
  );
}

function HouseLeaderboardPreview({ leaderboard }) {
  const { currentUserRank, totalRanked, nearby } = leaderboard;
  return (
    <section className="h-full rounded-2xl border border-white/10 bg-neutral-900/60 p-6">
      <div className="flex items-baseline justify-between">
        <h2 className="text-sm font-medium text-neutral-300">House Standing</h2>
        <span className="text-xs text-neutral-500">of {totalRanked} students</span>
      </div>
      <p className="mt-2 text-3xl font-semibold tabular-nums text-neutral-50">#{currentUserRank}<span className="ml-2 text-sm font-normal text-neutral-500">your position</span></p>
      <ol className="mt-4 space-y-1.5">
        {nearby.map((e) => (
          <li key={e.rank} className={`flex items-center justify-between rounded-lg px-3 py-2 text-sm ${e.isCurrentUser ? "bg-amber-400/10 ring-1 ring-inset ring-amber-400/25" : ""}`}>
            <span className="flex min-w-0 items-center gap-3">
              <span className="w-6 shrink-0 tabular-nums text-neutral-500">#{e.rank}</span>
              <span className={`truncate ${e.isCurrentUser ? "font-semibold text-amber-300" : "text-neutral-300"}`}>{e.isCurrentUser ? "You" : e.name}</span>
            </span>
            <span className="shrink-0 tabular-nums font-medium text-neutral-200">{e.points} pts</span>
          </li>
        ))}
      </ol>
      <button type="button" className="mt-5 inline-flex w-full items-center justify-center gap-1.5 rounded-lg border border-white/10 py-2 text-sm font-medium text-neutral-300 transition hover:bg-white/5 hover:text-neutral-100">
        View Full Leaderboard
        <ArrowRight className="h-4 w-4" />
      </button>
    </section>
  );
}

function Skeleton() {
  const Block = ({ className = "" }) => <div className={`animate-pulse rounded-lg bg-white/[0.06] ${className}`} />;
  const Card = ({ className = "" }) => (
    <div className={`rounded-2xl border border-white/10 bg-neutral-900/60 p-6 ${className}`}>
      <Block className="h-4 w-32" /><Block className="mt-4 h-8 w-24" /><Block className="mt-3 h-3 w-full" /><Block className="mt-2 h-3 w-2/3" />
    </div>
  );
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between"><Block className="h-8 w-56" /><Block className="h-9 w-32" /></div>
      <div className="rounded-2xl border border-white/10 bg-neutral-900/60 p-8">
        <Block className="h-3 w-40" /><Block className="mt-4 h-16 w-40" /><Block className="mt-4 h-2 w-full" />
      </div>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"><Card /><Card /><Card /></div>
      <Card /><Card />
    </div>
  );
}

function EmptyState({ onReset }) {
  return (
    <div className="flex flex-col items-center rounded-2xl border border-white/10 bg-neutral-900/60 px-6 py-16 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-400/10">
        <Sparkles className="h-6 w-6 text-amber-400" />
      </div>
      <h2 className="mt-4 text-base font-semibold text-neutral-100">No merit activity yet</h2>
      <p className="mt-1.5 max-w-sm text-sm text-neutral-400">Attend your first event to start earning merit points.</p>
      <button type="button" onClick={onReset} className="mt-6 rounded-lg bg-amber-400 px-4 py-2 text-sm font-semibold text-neutral-950 transition hover:bg-amber-300">
        Browse Events
      </button>
    </div>
  );
}

function ErrorState({ onRetry }) {
  return (
    <div className="flex flex-col items-center rounded-2xl border border-rose-400/20 bg-rose-400/[0.04] px-6 py-16 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-rose-400/10">
        <AlertTriangle className="h-6 w-6 text-rose-400" />
      </div>
      <h2 className="mt-4 text-base font-semibold text-neutral-100">Couldn't load your merit sheet</h2>
      <p className="mt-1.5 max-w-sm text-sm text-neutral-400">Something went wrong while retrieving your merit information.</p>
      <button type="button" onClick={onRetry} className="mt-6 rounded-lg border border-white/10 bg-neutral-900 px-4 py-2 text-sm font-semibold text-neutral-200 transition hover:bg-neutral-800">
        Try Again
      </button>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function MeritSheetPreview() {
  const [view, setView] = useState("loaded"); // loaded | loading | empty | error
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 900);
  };

  return (
    <div className="min-h-[calc(100vh-72px)] w-full overflow-x-hidden bg-neutral-950 text-neutral-200">
      {/* demo-only view switcher — not part of the real page */}
      <div className="border-b border-white/10 bg-neutral-900 px-4 py-2">
        <div className="flex w-full flex-wrap items-center gap-2 text-xs">
          <span className="text-neutral-500">Preview state:</span>
          {["loaded", "loading", "empty", "error"].map((v) => (
            <button
              key={v} onClick={() => setView(v)}
              className={`rounded-full px-3 py-1 font-medium transition ${view === v ? "bg-amber-400 text-neutral-950" : "bg-white/5 text-neutral-400 hover:bg-white/10"}`}
            >
              {v}
            </button>
          ))}
        </div>
      </div>

      <div className="w-full space-y-6 px-4 py-8 sm:px-6 lg:px-8">
        {view === "loading" && <Skeleton />}

        {view === "error" && <ErrorState onRetry={() => setView("loaded")} />}

        {view !== "loading" && view !== "error" && (
          <>
            <Header semester={mockData.summary.semester} isRefreshing={isRefreshing} onRefresh={handleRefresh} />

            {view === "empty" ? (
              <EmptyState onReset={() => setView("loaded")} />
            ) : (
              <>
                <MeritOverviewCard summary={mockData.summary} houseColor={mockData.student.house.color} />
                <div className="grid gap-6 lg:grid-cols-3">
                  <div className="lg:col-span-1"><StudentHouseCard student={mockData.student} /></div>
                  <div className="lg:col-span-2"><MeritBreakdown entries={mockData.breakdown} /></div>
                </div>
                <RecentMeritActivity activity={mockData.activity} />
                <AttendanceOverview attendance={mockData.attendance} />
                <AchievementGrid achievements={mockData.achievements} />
                <div className="grid gap-6 lg:grid-cols-2">
                  <NextMilestoneCard summary={mockData.summary} />
                  <HouseLeaderboardPreview leaderboard={mockData.leaderboard} />
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}