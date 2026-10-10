import { useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight, Check, Flag, Search, Shield, Sparkles, Trophy } from "lucide-react";
import type { Row } from "../../services/queries";
import type { StudentSummary } from "./LivePortal";
import HouseLogo from "../ui/HouseLogo";
import "./student-experience.css";

export function ExperienceFrame({ children }: { children: ReactNode }) {
  return <div className="student-experience mx-auto max-w-7xl space-y-6 px-4 py-6 text-neutral-200 sm:px-6 sm:py-8 lg:px-8">{children}</div>;
}

export function ExperienceHeading({ eyebrow, title, description, children }: { eyebrow: string; title: string; description: string; children?: ReactNode }) {
  return <header className="flex flex-wrap items-end justify-between gap-4"><div className="min-w-0"><p className="xp-eyebrow">{eyebrow}</p><h1 className="mt-3 text-3xl font-semibold tracking-tight text-white sm:text-4xl">{title}</h1><p className="mt-3 max-w-xl text-sm leading-6 text-neutral-400">{description}</p></div>{children}</header>;
}

export function ExperienceCard({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <section className={`xp-card ${className}`}>{children}</section>;
}

export function MilestoneProgress({ data }: { data: StudentSummary }) {
  const configured = Number(data.settings.merit_milestone);
  const step = Number.isFinite(configured) && configured > 0 ? configured : 300;
  const earned = Math.max(0, data.points);
  const completed = Math.floor(earned / step);
  const next = (completed + 1) * step;
  const percent = (earned % step) / step * 100;
  return <section className="xp-hero grid gap-8 p-6 sm:p-8 lg:grid-cols-[1fr_260px]">
    <div className="min-w-0"><p className="xp-eyebrow flex items-center gap-2"><Sparkles size={16} /> Your campus journey</p><h2 className="mt-4 max-w-lg text-2xl font-semibold leading-tight tracking-tight text-white sm:text-3xl">Small steps. Great experiences.</h2><p className="mt-3 max-w-lg text-sm leading-6 text-neutral-300">Show up, get involved, and make your mark. Every verified point brings your next milestone closer.</p><div className="mt-6 flex flex-wrap gap-3"><Link className="xp-button xp-primary" to="/events">Find your next event <ArrowUpRight size={17} /></Link><Link className="xp-button" to="/merit?view=points">View my points</Link></div></div>
    <div className="rounded-2xl border border-amber-200/15 bg-black/20 p-5"><div className="flex items-center justify-between gap-3"><span className="text-xs text-neutral-300">Next milestone</span><Flag size={18} className="text-amber-300" /></div><p className="mt-3 text-4xl font-semibold tabular-nums text-white">{next.toLocaleString()} <span className="text-sm font-normal text-neutral-400">pts</span></p><p className="mt-3 text-xs text-amber-200">{(next - data.points).toLocaleString()} points to go</p><div className="xp-track mt-4" role="progressbar" aria-label="Progress to next merit milestone" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(percent)} aria-valuetext={`${earned % step} of ${step} points in this milestone`}><span style={{ width: `${percent}%` }} /></div><p className="mt-3 text-xs leading-5 text-neutral-400">{completed.toLocaleString()} milestone{completed === 1 ? "" : "s"} reached · {data.points.toLocaleString()} total points</p></div>
  </section>;
}

export function JourneyChecklist({ data }: { data: StudentSummary }) {
  const goals = [
    { title: "Find your first event", detail: "Reserve a place in a campus activity.", done: data.registered > 0 || data.attendance > 0, to: "/events", action: "Explore events" },
    { title: "Be part of the action", detail: "Attend and have your check-in verified.", done: data.attendance > 0, to: "/merit", action: "View attendance" },
    { title: "Start your points story", detail: "Earn your first approved merit points.", done: data.points > 0, to: "/merit?view=points", action: "View points" },
  ];
  return <ExperienceCard><div className="flex items-start justify-between gap-3"><div><p className="xp-eyebrow">Make a start</p><h2 className="mt-2 text-lg font-semibold text-white">Your participation path</h2></div><span className="xp-tag">{goals.filter(goal => goal.done).length} / 3</span></div><p className="mt-2 text-xs leading-5 text-neutral-400">A guide to getting involved, based on your current record.</p><ol className="mt-5 space-y-3">{goals.map((goal, index) => <li key={goal.title}><Link className="xp-journey" to={goal.to}><span className={`xp-step ${goal.done ? "xp-step-done" : ""}`}>{goal.done ? <Check size={17} aria-label="Completed" /> : index + 1}</span><div className="min-w-0 flex-1"><h3 className="text-sm font-medium text-white">{goal.title}</h3><p className="mt-1 text-xs leading-5 text-neutral-400">{goal.detail}</p><p className="mt-2 text-xs text-amber-200">{goal.action} →</p></div></Link></li>)}</ol></ExperienceCard>;
}

export function ExperienceStandings({ houses, houseName, interactive = false }: { houses: Row[]; houseName?: string; interactive?: boolean }) {
  const [search, setSearch] = useState("");
  const [onlyMine, setOnlyMine] = useState(false);
  const visible = houses.filter(house => String(house.name).toLowerCase().includes(search.toLowerCase()) && (!onlyMine || (!house.identity_hidden && house.name === houseName)));
  const highest = Math.max(1, ...houses.map(house => Number(house.total_points) || 0));
  return <ExperienceCard><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="xp-eyebrow flex items-center gap-2"><Trophy size={15} /> Together we rise</p><h2 className="mt-2 text-lg font-semibold text-white">House leaderboard</h2></div>{!interactive && <Link to="/stats" className="xp-text-link">Full standings <ArrowUpRight size={15} /></Link>}</div><p className="mt-2 text-xs leading-5 text-neutral-400">Approved house points. Equal totals share a rank.</p>
    {interactive && <div className="mt-5 flex flex-wrap gap-3"><label className="relative min-w-0 flex-1"><Search size={16} aria-hidden="true" className="absolute left-3 top-3.5 text-neutral-400" /><input className="xp-input pl-10" aria-label="Search houses" placeholder="Find a house" value={search} onChange={event => setSearch(event.target.value)} /></label>{houseName && <button className={`xp-button ${onlyMine ? "xp-primary" : ""}`} aria-pressed={onlyMine} onClick={() => setOnlyMine(!onlyMine)}><Shield size={16} /> My house</button>}</div>}
    <ol className="mt-5 space-y-3" aria-label="House standings">{visible.map(house => {
      const mine = !house.identity_hidden && house.name === houseName;
      const rank = Number(house.rank) || houses.indexOf(house) + 1;
      return <li key={house.id} className={`xp-standing ${mine ? "xp-standing-mine" : ""}`}><span className={`w-7 shrink-0 text-center text-lg font-semibold ${rank === 1 ? "text-amber-300" : "text-neutral-400"}`}>{rank}</span>{!house.identity_hidden && <HouseLogo name={String(house.name)} src={String(house.logo_url || "")} color={String(house.color_code || "")} />}<div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h3 className="break-words text-sm font-semibold text-white">{String(house.name)}</h3>{mine && <span className="xp-tag">Your house</span>}</div><div className="mt-2 flex flex-wrap justify-between gap-1 text-xs text-neutral-400">{!house.identity_hidden && <span>{Number(house.member_count || 0).toLocaleString()} students</span>}<span className="text-amber-200">{Number(house.total_points || 0).toLocaleString()} pts</span></div><div className="xp-track mt-2" aria-hidden="true"><span style={{ width: `${Math.max(0, Number(house.total_points) / highest * 100)}%` }} /></div></div></li>;
    })}</ol><div aria-live="polite">{!visible.length && <div className="py-8 text-center"><Shield className="mx-auto text-neutral-500" size={28} /><p className="mt-3 text-sm text-white">{houses.length ? "No houses match your filters" : "The standings are taking shape"}</p><p className="mt-2 text-xs text-neutral-400">{houses.length ? "Try another name or show all houses." : "House points will appear here when published by your school."}</p>{houses.length > 0 && <button className="xp-button mt-4" onClick={() => { setSearch(""); setOnlyMine(false); }}>Clear house filters</button>}</div>}</div>
  </ExperienceCard>;
}
