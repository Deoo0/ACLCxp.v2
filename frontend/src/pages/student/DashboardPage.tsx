import { Link } from "react-router-dom";
import { ArrowUpRight, CalendarCheck2, CalendarDays, MapPin, QrCode, Sparkles, Trophy } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useApi, type PageData, type Row } from "../../services/queries";
import { eventSchedule } from "../../services/studentExperience";
import type { StudentSummary } from "../../components/dashboard/LivePortal";
import { Loading, Notice } from "../../components/admin/ConsoleUI";
import { ExperienceCard, ExperienceFrame, ExperienceHeading, ExperienceStandings, JourneyChecklist, MilestoneProgress } from "../../components/dashboard/StudentExperience";
import StudentCompetitions from "../../components/dashboard/StudentCompetitions";
import TeamShowcase from "../../components/dashboard/TeamShowcase";

export default function DashboardPage() {
  const { user } = useAuth();
  const query = useApi<StudentSummary>("/portal/summary/");
  const events = useApi<PageData<Row>>("/events/?upcoming=true&page_size=3");
  return <ExperienceFrame>
    <ExperienceHeading eyebrow="Your student hub" title={`Welcome back${user?.first_name ? `, ${user.first_name}` : ""}.`} description="Your progress, your house, and your next campus adventure. All in one place.">
      <button className="xp-button" onClick={() => window.dispatchEvent(new Event("aclcxp:open-student-qr"))}><QrCode size={17} /> My event pass</button>
    </ExperienceHeading>
    {query.isPending ? <Loading /> : query.isError ? <Notice error={query.error} retry={() => void query.refetch()} /> : <>
      {query.data.settings.announcement && <ExperienceCard className="!border-amber-200/20"><p className="xp-eyebrow">Campus announcement</p><p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-neutral-300">{query.data.settings.announcement}</p></ExperienceCard>}
      <MilestoneProgress data={query.data} />
      <nav aria-label="Your progress shortcuts" className="grid grid-cols-2 gap-3 lg:grid-cols-4">{[
        { label: "Merit points", value: query.data.points.toLocaleString(), icon: Sparkles, to: "/merit?view=points", hint: "View points history", color: "text-amber-300" },
        { label: "Events attended", value: query.data.attendance.toLocaleString(), icon: CalendarCheck2, to: "/merit", hint: "Your verified record", color: "text-emerald-300" },
        { label: "Registrations", value: query.data.registered.toLocaleString(), icon: CalendarDays, to: "/events?view=reservations", hint: "Manage reservations", color: "text-sky-300" },
        { label: "Student rank", value: query.data.rank > 0 ? `#${query.data.rank}` : "Unranked", icon: Trophy, to: "/stats", hint: "Explore standings", color: "text-violet-300" },
      ].map(item => <Link key={item.label} to={item.to} className="xp-stat"><div className="flex items-center justify-between"><item.icon size={19} className={item.color} /><ArrowUpRight size={14} className="text-neutral-500" /></div><p className="mt-4 break-words text-2xl font-semibold tabular-nums text-white">{item.value}</p><p className="mt-1 text-xs font-medium text-neutral-300">{item.label}</p><p className="mt-3 text-[11px] leading-4 text-neutral-400">{item.hint}</p></Link>)}</nav>
      <div className="grid items-start gap-5 lg:grid-cols-2"><JourneyChecklist data={query.data} /><ExperienceCard><div className="flex flex-wrap items-start justify-between gap-2"><div><p className="xp-eyebrow">Your next adventure</p><h2 className="mt-2 text-lg font-semibold text-white">Discover events</h2></div><Link className="xp-text-link" to="/events">View all <ArrowUpRight size={15} /></Link></div><p className="mt-2 text-xs leading-5 text-neutral-400">Find something you enjoy. Check the details before joining.</p>
        {events.isPending ? <Loading /> : events.isError ? <div className="mt-4"><Notice error={events.error} retry={() => void events.refetch()} /></div> : <div className="mt-5 space-y-3">{events.data.data.map(event => {
          const schedule = eventSchedule(event.event_date, event.start_time, event.end_time);
          return <Link key={event.id} className="xp-journey" to={`/events?event=${event.id}`}><CalendarDays size={20} className="mt-1 shrink-0 text-amber-300" /><div className="min-w-0 flex-1"><p className="text-[10px] text-amber-200">{String(event.category_name || "Campus activity")}</p><h3 className="mt-1 break-words text-sm font-medium text-white">{String(event.title)}</h3><p className="mt-2 text-xs leading-5 text-neutral-400">{schedule.date} · {schedule.time}</p><p className="mt-1 flex items-start gap-1 text-xs text-neutral-400"><MapPin size={12} className="mt-0.5 shrink-0" />{String(event.venue || "Venue to be announced")}</p></div><ArrowUpRight size={16} className="shrink-0 text-neutral-500" /></Link>;
        })}{!events.data.data.length && <div className="rounded-xl border border-dashed border-white/15 p-6 text-center"><CalendarDays className="mx-auto text-amber-300" size={25} /><p className="mt-3 text-sm text-white">Your next adventure is on its way</p><p className="mt-2 text-xs leading-5 text-neutral-400">Upcoming events will appear when your school publishes them.</p><Link to="/events" className="xp-text-link">Browse the event board →</Link></div>}</div>}
      </ExperienceCard></div>
      <ExperienceStandings houses={query.data.houses} houseName={user?.house_name} />
      <TeamShowcase />
      <StudentCompetitions compact />
    </>}
  </ExperienceFrame>;
}
