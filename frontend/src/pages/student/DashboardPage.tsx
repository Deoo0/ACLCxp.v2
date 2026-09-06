import { Link } from "react-router-dom";
import { format } from "date-fns";
import {
  ArrowRight,
  CalendarCheck2,
  CalendarDays,
  ChevronRight,
  MapPin,
  Medal,
  QrCode,
  Sparkles,
  Trophy,
  Users,
} from "lucide-react";
import { mockEvents } from "../../mocks/data";
import { useAuth } from "../../context/AuthContext";

const MERIT_POINTS = 245;
const NEXT_MILESTONE = 300;
const EVENTS_ATTENDED = 18;
const EVENTS_REGISTERED = 22;

function formatEventDate(date: string) {
  return format(new Date(date), "EEE, MMM d · h:mm a");
}

function StatCard({ icon: Icon, label, value, detail, accent }: {
  icon: typeof Sparkles;
  label: string;
  value: string;
  detail: string;
  accent: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-neutral-900/60 p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs font-medium uppercase tracking-wider text-neutral-500">{label}</p>
        <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${accent}`}>
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <p className="mt-4 text-2xl font-semibold tracking-tight text-neutral-50 sm:text-3xl">{value}</p>
      <p className="mt-1 text-xs text-neutral-500">{detail}</p>
    </div>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const firstName = user?.first_name || "Student";
  const houseName = user?.house_name || "Your House";
  const houseColor = user?.house_color || "#F5B300";
  const houseInitials = houseName.split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase();
  const upcomingEvents = [...mockEvents]
    .sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime())
    .slice(0, 3);
  const milestoneProgress = Math.min(100, Math.round((MERIT_POINTS / NEXT_MILESTONE) * 100));
  const attendanceRate = Math.round((EVENTS_ATTENDED / EVENTS_REGISTERED) * 100);

  return (
    <div className="min-h-[calc(100vh-72px)] overflow-x-hidden bg-neutral-950 text-neutral-200">
      <main className="mx-auto w-full max-w-7xl space-y-5 px-4 py-6 sm:space-y-6 sm:px-6 sm:py-8 lg:px-8">
        <header className="flex items-end justify-between gap-4">
          <div>
            <p className="text-sm text-neutral-400">Welcome back, {firstName}</p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-neutral-50 sm:text-3xl">Your student dashboard</h1>
          </div>
          <Link to="/profile" className="hidden items-center gap-2 rounded-xl border border-white/10 bg-neutral-900 px-3 py-2 text-sm font-medium text-neutral-300 transition hover:bg-neutral-800 sm:inline-flex">
            Profile <ChevronRight className="h-4 w-4" />
          </Link>
        </header>

        <section className="relative overflow-hidden rounded-2xl border border-white/10 bg-neutral-900/60 p-5 sm:p-7">
          <div className="pointer-events-none absolute -right-20 -top-24 h-56 w-56 rounded-full blur-3xl" style={{ backgroundColor: `${houseColor}38` }} />
          <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-widest text-amber-400"><Sparkles className="h-4 w-4" /> Today’s progress</div>
              <h2 className="mt-3 text-xl font-semibold text-neutral-50 sm:text-2xl">You’re {NEXT_MILESTONE - MERIT_POINTS} points from your next milestone.</h2>
              <p className="mt-2 max-w-xl text-sm leading-6 text-neutral-400">Keep building your record through event participation, achievements, and house activities.</p>
              <div className="mt-5 flex flex-wrap gap-3">
                <Link to="/merit" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-amber-400 px-4 py-2.5 text-sm font-semibold text-neutral-950 transition hover:bg-amber-300 active:scale-[0.98]">View merit sheet <ArrowRight className="h-4 w-4" /></Link>
                <Link to="/events" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm font-medium text-neutral-200 transition hover:bg-white/[0.07] active:scale-[0.98]"><CalendarDays className="h-4 w-4" /> Explore events</Link>
              </div>
            </div>
            <div className="flex items-center gap-4 rounded-2xl border border-white/10 bg-neutral-950/40 p-3.5 sm:w-52 sm:flex-col sm:text-center">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-sm font-bold text-neutral-950" style={{ backgroundColor: houseColor }}>{houseInitials || "H"}</div>
              <div className="min-w-0"><p className="truncate text-sm font-semibold text-neutral-100">{houseName}</p><p className="mt-0.5 text-xs text-neutral-500">House member</p></div>
            </div>
          </div>
        </section>

        <section aria-label="Student statistics" className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          <StatCard icon={Sparkles} label="Merit points" value={`${MERIT_POINTS}`} detail={`${NEXT_MILESTONE - MERIT_POINTS} pts to next milestone`} accent="bg-amber-400/10 text-amber-300" />
          <StatCard icon={CalendarCheck2} label="Attendance" value={`${attendanceRate}%`} detail={`${EVENTS_ATTENDED} of ${EVENTS_REGISTERED} registered`} accent="bg-sky-400/10 text-sky-300" />
          <StatCard icon={Trophy} label="House rank" value="#12" detail="of 214 students" accent="bg-violet-400/10 text-violet-300" />
          <StatCard icon={Medal} label="Achievements" value="3 / 6" detail="badges unlocked" accent="bg-emerald-400/10 text-emerald-300" />
        </section>

        <div className="grid gap-5 lg:grid-cols-5 lg:gap-6">
          <section className="rounded-2xl border border-white/10 bg-neutral-900/60 p-5 sm:p-6 lg:col-span-3">
            <div className="flex items-center justify-between gap-3">
              <div><h2 className="text-base font-semibold text-neutral-100">Upcoming events</h2><p className="mt-1 text-sm text-neutral-500">Your next chances to earn merit points.</p></div>
              <Link to="/events" className="inline-flex shrink-0 items-center gap-1 text-sm font-medium text-amber-400 hover:text-amber-300">See all <ChevronRight className="h-4 w-4" /></Link>
            </div>
            <div className="mt-5 space-y-3">
              {upcomingEvents.map((event) => (
                <Link key={event.id} to="/events" className="group flex items-center gap-3 rounded-xl border border-white/5 bg-neutral-950/40 p-3 transition hover:border-white/10 hover:bg-white/[0.04] sm:gap-4 sm:p-4">
                  <div className="flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-xl bg-white/[0.06] text-center"><span className="text-[10px] font-medium uppercase text-neutral-500">{format(new Date(event.startAt), "MMM")}</span><span className="text-base font-semibold leading-none text-neutral-100">{format(new Date(event.startAt), "d")}</span></div>
                  <div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold text-neutral-100">{event.title}</p><p className="mt-1 truncate text-xs text-neutral-500">{formatEventDate(event.startAt)} · {event.house}</p>{event.location && <p className="mt-1 flex items-center gap-1 truncate text-xs text-neutral-500"><MapPin className="h-3 w-3 shrink-0" />{event.location}</p>}</div>
                  <ChevronRight className="h-5 w-5 shrink-0 text-neutral-600 transition group-hover:text-neutral-300" />
                </Link>
              ))}
            </div>
          </section>

          <div className="space-y-5 lg:col-span-2 lg:space-y-6">
            <section className="rounded-2xl border border-white/10 bg-neutral-900/60 p-5 sm:p-6">
              <div className="flex items-center justify-between"><div><h2 className="text-base font-semibold text-neutral-100">Merit progress</h2><p className="mt-1 text-sm text-neutral-500">Current semester</p></div><span className="text-sm font-semibold text-amber-400">{milestoneProgress}%</span></div>
              <div className="mt-5 h-2.5 overflow-hidden rounded-full bg-white/5"><div className="h-full rounded-full bg-gradient-to-r from-amber-500 to-amber-300" style={{ width: `${milestoneProgress}%` }} /></div>
              <div className="mt-3 flex justify-between text-xs text-neutral-500"><span>{MERIT_POINTS} pts earned</span><span>{NEXT_MILESTONE} pts goal</span></div>
              <Link to="/merit" className="mt-5 inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-xl border border-white/10 text-sm font-medium text-neutral-300 transition hover:bg-white/[0.05]">Open merit sheet <ArrowRight className="h-4 w-4" /></Link>
            </section>
            <section className="rounded-2xl border border-white/10 bg-neutral-900/60 p-5 sm:p-6">
              <div className="flex items-start gap-3"><div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-400/10 text-rose-300"><QrCode className="h-5 w-5" /></div><div><h2 className="text-base font-semibold text-neutral-100">Ready to check in?</h2><p className="mt-1 text-sm leading-5 text-neutral-500">Open your QR code when you arrive at an event.</p></div></div>
              <p className="mt-4 flex items-center gap-2 text-xs text-neutral-500"><Users className="h-3.5 w-3.5" /> Your attendance updates your merit automatically.</p>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}
