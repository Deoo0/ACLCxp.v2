import Carousel from "../ui/Carousel";
import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, ArrowUpRight, CalendarDays, Clock3, MapPin, Ticket, Trophy, Users } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useApi, type PageData, type Row } from "../../services/queries";
import { Notice } from "../admin/ConsoleUI";

function schedule(row: Row) {
  const date = new Date(`${String(row.event_date)}T00:00:00`);
  const valid = !Number.isNaN(date.getTime());
  const time = String(row.start_time || "").split(":");
  const hour = Number(time[0]);
  return {
    month: valid ? date.toLocaleDateString("en-PH", { month: "short" }) : "TBA",
    day: valid ? String(date.getDate()).padStart(2, "0") : "—",
    date: valid ? date.toLocaleDateString("en-PH", { weekday: "short", month: "short", day: "numeric", year: "numeric" }) : "Date to be announced",
    time: time.length >= 2 ? `${hour % 12 || 12}:${time[1]} ${hour < 12 ? "AM" : "PM"} UTC` : "Time to be announced",
  };
}

function EventCard({ event, destination, action }: { event: Row; destination: string; action: string }) {
  const [failedImage, setFailedImage] = useState("");
  const photo = String(event.poster_image || event.banner_image || "");
  const hasPhoto = Boolean(photo && photo !== failedImage);
  const when = schedule(event);
  const slots = Math.max(0, Number(event.available_slots) || 0);

  return <article className="group flex min-w-0 flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#141618] transition duration-300 hover:border-amber-300/35 hover:shadow-xl hover:shadow-black/25">
    <div className="flex items-center justify-between gap-3 border-b border-white/10 px-5 py-3">
      <span className="truncate text-[10px] font-bold uppercase tracking-[.15em] text-neutral-400">{String(event.category_name || 'Campus event')}</span>
      <span className="flex shrink-0 items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-amber-200"><span className="h-1.5 w-1.5 rounded-full bg-amber-300" />{event.status === "ONGOING" ? "Happening now" : "Upcoming"}</span>
    </div>
    <div className="relative isolate flex aspect-[4/3] items-center justify-center overflow-hidden bg-neutral-950">
      {hasPhoto ? <>
        <div aria-hidden="true" className="absolute inset-0 -z-10 scale-110 bg-cover bg-center opacity-25 blur-xl" style={{ backgroundImage: `url(${JSON.stringify(photo)})` }} />
        <div className="flex h-full w-full items-center justify-center p-3">
          <img src={photo} alt={`${String(event.title)} event poster`} loading="lazy" className="h-full w-full object-contain drop-shadow-xl transition duration-300 group-hover:scale-[1.02]" onError={() => setFailedImage(photo)} />
        </div>
      </> : <div className="flex h-full w-full flex-col items-center justify-center bg-[radial-gradient(ellipse_at_top_right,rgba(251,191,36,0.15),transparent_70%)] p-8 text-center"><CalendarDays className="mb-4 h-12 w-12 text-amber-300/70" /><p className="text-[10px] font-bold uppercase tracking-[.2em] text-neutral-500">Meet. Compete. Connect.</p><p className="mt-3 text-xl font-bold text-neutral-200">See you on campus</p></div>}
    </div>
    <div className="flex flex-1 flex-col border-t border-white/10 p-5 sm:p-6">
      <div className="flex items-start gap-4">
        <div className="flex w-12 shrink-0 flex-col items-center rounded-xl border border-amber-300/20 bg-amber-300/5 py-2"><span className="text-[9px] font-bold uppercase tracking-widest text-amber-300">{when.month}</span><span className="mt-0.5 text-2xl font-extrabold leading-none text-white">{when.day}</span></div>
        <div className="min-w-0"><h3 className="break-words text-xl font-bold leading-snug tracking-tight text-white">{String(event.title)}</h3><p className="mt-1.5 text-xs text-neutral-500">{when.date}</p></div>
      </div>
      <p className="mt-4 line-clamp-3 text-sm leading-6 text-neutral-400">{String(event.description || 'Be part of the next campus experience. Explore the event and reserve your place.')}</p>
      <dl className="my-5 space-y-3 text-xs">
        <div className="flex items-start gap-2.5"><Clock3 className="h-4 w-4 shrink-0 text-amber-300/80" /><dt className="sr-only">Start time</dt><dd className="text-neutral-300">{when.time}</dd></div>
        <div className="flex items-start gap-2.5"><MapPin className="h-4 w-4 shrink-0 text-amber-300/80" /><dt className="sr-only">Venue</dt><dd className="break-words text-neutral-300">{String(event.venue || 'Venue to be announced')}</dd></div>
        <div className="flex items-start gap-2.5"><Users className="h-4 w-4 shrink-0 text-amber-300/80" /><dt className="sr-only">Availability</dt><dd className="text-neutral-300">{event.registration_required === false ? "Open attendance · No registration needed" : slots > 0 ? `${slots} ${slots === 1 ? 'place' : 'places'} available` : event.allow_waitlist ? 'Full · waitlist available' : 'All places reserved'}</dd></div>
      </dl>
      <div className="mt-auto flex items-center justify-between gap-3 border-t border-white/10 pt-4">
        <span className="flex items-center gap-1.5 text-[11px] text-neutral-400"><Trophy className="h-3.5 w-3.5 text-amber-300" /><span>{event.attendance_mode === "NONE" ? "No attendance required" : <><strong className="font-semibold text-neutral-200">{Number(event.participation_points) || 0} pts</strong> attendance</>}</span></span>
        <Link to={destination} className="flex min-h-10 items-center gap-2 rounded-lg bg-amber-300 px-3 py-2 text-xs font-bold text-neutral-950 transition hover:bg-amber-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-300">{action}<ArrowRight className="h-3.5 w-3.5" /></Link>
      </div>
    </div>
  </article>;
}

export default function OngoingEvents() {
  const [category, setCategory] = useState("");
  const [page, setPage] = useState(1);
  const categories = useApi<PageData>("/events/categories/?page_size=100");
  const query = useApi<PageData>(`/events/?upcoming=true&page_size=12&category=${category}&page=${page}`);
  const { user } = useAuth();
  const destination = user?.role === 'STUDENT' ? '/events' : user?.role === 'ADMIN' ? '/admin/events' : '/login';
  const action = user?.role === 'STUDENT' || user?.role === 'ADMIN' ? 'Explore event' : 'Log in to join';

  return <section id="events" className="relative scroll-mt-24 overflow-hidden bg-neutral-950 px-5 py-16 text-white sm:py-24">
    <div aria-hidden="true" className="pointer-events-none absolute -left-36 top-0 h-80 w-80 rounded-full bg-amber-300/[.035] blur-3xl" />
    <div className="relative mx-auto max-w-6xl">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div><p className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[.22em] text-amber-300"><span className="h-px w-7 bg-amber-300" />Campus calendar</p><h2 className="mt-4 max-w-xl text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl">More than a date.<br /><span className="text-neutral-400">Your next campus experience.</span></h2><p className="mt-4 max-w-lg text-sm leading-6 text-neutral-400">Find your crowd, show your skills, and make memories. Here’s what’s coming up at ACLC.</p></div>
        <Link to={destination} className="inline-flex min-h-11 items-center gap-3 rounded-full border border-white/20 px-5 py-2.5 text-xs font-semibold text-neutral-200 transition hover:border-amber-300/50 hover:text-amber-200 focus-visible:outline-2 focus-visible:outline-amber-300">Explore campus events<ArrowUpRight className="h-4 w-4" /></Link>
      </div>
      <div className="mt-8 flex flex-wrap items-center justify-between gap-4">
        <label className="text-xs text-neutral-400">Browse by category<select className="mt-2 block min-h-11 w-full min-w-52 rounded-xl border border-white/20 bg-neutral-900 px-3 text-sm text-white focus:outline-amber-300" value={category} onChange={e => { setCategory(e.target.value); setPage(1); }}><option value="">All categories</option>{categories.data?.data.map(row => <option key={row.id} value={row.id}>{String(row.name)}</option>)}</select></label>
        <p role="status" className="text-xs text-neutral-400">{query.data ? `${query.data.count} events to explore` : "Discover campus events"}</p>
      </div>
      {categories.isError && <div className="mt-4"><Notice error={categories.error} retry={() => void categories.refetch()} /></div>}
      <div className="mt-6">
        {query.isPending ? <div role="status" aria-label="Loading campus events" className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">{[0, 1, 2].map(item => <div key={item} aria-hidden="true" className="overflow-hidden rounded-2xl border border-white/10 bg-white/[.025] motion-safe:animate-pulse"><div className="aspect-[4/3] bg-white/5" /><div className="space-y-4 p-6"><div className="h-6 w-3/4 rounded bg-white/10" /><div className="h-3 rounded bg-white/5" /><div className="h-3 w-2/3 rounded bg-white/5" /></div></div>)}</div> : query.isError ? <Notice error={query.error} retry={() => void query.refetch()} /> : query.data.data.length ? <Carousel key={`${category}-${page}`} label="campus events">{query.data.data.map(event => <EventCard key={event.id} event={event} destination={destination} action={action} />)}</Carousel> : <div className="rounded-2xl border border-dashed border-white/15 bg-white/[.02] px-6 py-14 text-center"><Ticket className="mx-auto h-9 w-9 text-amber-300/70" /><h3 className="mt-4 text-lg font-semibold">Something to look forward to</h3><p className="mt-2 text-sm text-neutral-400">The next campus events will appear here as soon as they’re published.</p></div>}
      </div>
      {query.data && (query.data.previous || query.data.next) && <div className="mt-4 flex items-center justify-center gap-4"><button className="min-h-11 rounded-xl border border-white/20 px-4 text-sm disabled:opacity-30" disabled={!query.data.previous} onClick={() => setPage(page - 1)}>Previous events</button><span className="text-xs text-neutral-400">Page {page}</span><button className="min-h-11 rounded-xl border border-white/20 px-4 text-sm disabled:opacity-30" disabled={!query.data.next} onClick={() => setPage(page + 1)}>More events</button></div>}
    </div>
  </section>;
}
