import { useEffect, useId, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion, useReducedMotion } from "framer-motion";
import { ChevronLeft, ChevronRight, Pause, Play, Users } from "lucide-react";
import api from "../../services/api";
import type { PageData, Row } from "../../services/queries";
import type { EventTeam } from "../admin/EventTeamsEditor";
import { Notice } from "../admin/ConsoleUI";

const ROTATION_MS = 2000;
const control = "flex min-h-11 min-w-11 items-center justify-center gap-2 rounded-full border border-white/15 px-3 text-sm text-neutral-200 hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-amber-300 disabled:opacity-30";

export function TeamShowcaseCarousel({ events }: { events: Row[] }) {
  const slides = events.flatMap(event => Array.isArray(event.teams)
    ? (event.teams as EventTeam[]).map((team, teamIndex) => ({ event, team, teamIndex, key: `${event.id}-${team.house}` })) : []);
  const [activeKey, setActiveKey] = useState("");
  const [paused, setPaused] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [visible, setVisible] = useState(() => !document.hidden);
  const [inView, setInView] = useState(false);
  const reducedMotion = useReducedMotion();
  const root = useRef<HTMLElement>(null);
  const id = useId();
  const index = Math.max(0, slides.findIndex(slide => slide.key === activeKey));
  const current = slides[index];
  const hasSlides = Boolean(current);
  const nextKey = slides[(index + 1) % slides.length]?.key;
  const playing = !paused && !reducedMotion;
  const rotating = playing && !hovered && visible && inView && slides.length > 1;

  useEffect(() => {
    const update = () => setVisible(!document.hidden);
    document.addEventListener("visibilitychange", update);
    return () => document.removeEventListener("visibilitychange", update);
  }, []);

  useEffect(() => {
    const element = root.current;
    if (!element) return;
    const observer = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), { threshold: 0.25 });
    observer.observe(element);
    return () => observer.disconnect();
  }, [hasSlides]);

  useEffect(() => {
    if (!rotating || !nextKey) return;
    const timer = window.setTimeout(() => setActiveKey(nextKey), ROTATION_MS);
    return () => window.clearTimeout(timer);
  }, [rotating, current?.key, nextKey]);

  if (!current) return null;
  const { event, team, teamIndex } = current;
  const teams = event.teams as EventTeam[];
  const availableEvents = events.filter(item => Array.isArray(item.teams) && item.teams.length);
  const move = (step: number) => {
    setPaused(true);
    setActiveKey(slides[(index + step + slides.length) % slides.length].key);
  };

  return <section ref={root} aria-label="Event house teams" aria-roledescription="carousel"
    onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
    onFocusCapture={e => { if (!(e.target as HTMLElement).closest('[data-playback]')) setPaused(true); }}
    className="min-w-0 overflow-hidden rounded-2xl border border-amber-300/20 bg-gradient-to-br from-amber-300/[.06] to-neutral-900">
    <div className="flex flex-wrap items-start justify-between gap-4 border-b border-white/10 p-5 sm:p-6">
      <div><p className="text-[10px] font-bold uppercase tracking-[.18em] text-amber-300">In the house spotlight</p><h2 className="mt-2 text-xl font-semibold text-white">Meet the teams</h2><p className="mt-2 text-xs leading-5 text-neutral-400">{reducedMotion ? "Browse each event and its house teams." : "Every house gets a turn, then the next event takes the spotlight."}</p></div>
      <div className="flex items-center gap-2">
        {!reducedMotion && slides.length > 1 && <button type="button" data-playback aria-label={playing ? "Pause team slideshow" : "Play team slideshow"} className={control} onClick={() => setPaused(playing)}>{playing ? <Pause size={16} /> : <Play size={16} />}{playing ? "Pause" : "Play"}</button>}
        <button type="button" className={control} aria-controls={id} aria-label="Previous team" disabled={slides.length < 2} onClick={() => move(-1)}><ChevronLeft size={18} /></button>
        <button type="button" className={control} aria-controls={id} aria-label="Next team" disabled={slides.length < 2} onClick={() => move(1)}><ChevronRight size={18} /></button>
      </div>
    </div>
    <div className="p-5 sm:p-6">
      <label className="block text-xs text-neutral-400" htmlFor={`${id}-event`}>Featured event</label>
      <select id={`${id}-event`} className="mt-2 min-h-11 w-full min-w-0 rounded-xl border border-white/15 bg-neutral-950 px-3 text-sm text-white focus-visible:outline-2 focus-visible:outline-amber-300" value={event.id} onChange={e => { setPaused(true); setActiveKey(slides.find(slide => slide.event.id === Number(e.target.value))!.key); }}>
        {availableEvents.map(item => <option key={item.id} value={item.id}>{String(item.title)}</option>)}
      </select>
      <div id={id} tabIndex={0} onKeyDown={e => { if (e.target === e.currentTarget && ["ArrowLeft", "ArrowRight"].includes(e.key)) { e.preventDefault(); move(e.key === "ArrowLeft" ? -1 : 1); } }} onTouchStart={() => setPaused(true)} aria-live={playing ? "off" : "polite"} className="mt-5 rounded-xl focus-visible:outline-2 focus-visible:outline-amber-300">
          <motion.article key={current.key} initial={{ opacity: reducedMotion ? 1 : 0 }} animate={{ opacity: 1 }} transition={{ duration: reducedMotion ? 0 : 0.25 }} aria-roledescription="slide" aria-label={`${String(event.title)}, ${team.house_name}, team ${teamIndex + 1} of ${teams.length}`} className="grid min-w-0 overflow-hidden rounded-xl border border-white/10 bg-black/20 lg:grid-cols-2">
            {team.photo ? <img src={team.photo} alt={`${team.house_name} team for ${String(event.title)}`} className="aspect-[16/9] w-full bg-black/30 object-contain lg:h-full lg:max-h-96" /> : <div className="flex aspect-[16/9] items-center justify-center bg-amber-300/[.04] text-amber-300/40"><Users size={64} aria-hidden="true" /></div>}
            <div className="min-w-0 p-5">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-amber-300">{event.status === "ONGOING" ? "Happening now" : "Upcoming event"}</p>
              <h3 className="mt-2 break-words text-sm font-medium text-neutral-300">{String(event.title)}</h3>
              <h4 className="mt-3 break-words text-2xl font-semibold text-white">{team.house_name}</h4>
              <p className="mt-2 text-xs text-neutral-500">House {teamIndex + 1} of {teams.length} · Event {availableEvents.findIndex(item => item.id === event.id) + 1} of {availableEvents.length}</p>
              {team.members.length ? <ul tabIndex={0} aria-label={`${team.house_name} members`} className="mt-4 max-h-56 space-y-2 overflow-y-auto overscroll-contain rounded-lg focus-visible:outline-2 focus-visible:outline-amber-300">{team.members.map((member, memberIndex) => <li key={memberIndex} className="min-w-0 rounded-lg bg-white/5 px-3 py-2"><p className="break-words text-sm font-medium text-white">{member.name}</p><p className="mt-0.5 break-words text-xs text-neutral-400">{member.role}</p></li>)}</ul> : <p className="mt-5 text-sm text-neutral-400">Team members will be announced soon.</p>}
            </div>
          </motion.article>
      </div>
      <div className="mt-4 flex gap-2 overflow-x-auto pb-1" aria-label="Choose a house team">{teams.map((item, itemIndex) => <button key={item.house} type="button" aria-pressed={itemIndex === teamIndex} className={`min-h-11 shrink-0 rounded-full border px-4 text-xs focus-visible:outline-2 focus-visible:outline-amber-300 ${itemIndex === teamIndex ? 'border-amber-300/40 bg-amber-300/10 text-amber-200' : 'border-white/10 text-neutral-400 hover:bg-white/5'}`} onClick={() => { setPaused(true); setActiveKey(`${event.id}-${item.house}`); }}>{item.house_name}</button>)}</div>
    </div>
  </section>;
}

export default function TeamShowcase() {
  const query = useQuery({
    queryKey: ["dashboard-team-showcase"],
    queryFn: async ({ signal }) => {
      const events: Row[] = [];
      let page = 1;
      while (true) {
        const response = await api.get<PageData>(`/events/?upcoming=true&page_size=100&page=${page}`, { signal });
        events.push(...response.data.data);
        if (!response.data.next) return events;
        page += 1;
      }
    },
  });
  if (query.isPending) return <div role="status" className="rounded-2xl border border-white/10 p-6 text-sm text-neutral-400">Loading house teams…</div>;
  if (query.isError) return <Notice error={query.error} retry={() => void query.refetch()} />;
  return <TeamShowcaseCarousel events={query.data} />;
}
