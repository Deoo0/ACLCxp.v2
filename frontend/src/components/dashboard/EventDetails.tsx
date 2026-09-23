import EventTeams from "./EventTeams";
import * as Dialog from "@radix-ui/react-dialog";
import { useEffect, useState } from "react";
import { CalendarDays, Clock3, MapPin, Users, Trophy, Ticket, X, CheckCircle2, ClipboardList, ShieldCheck, Gift } from "lucide-react";
import type { Row } from "../../services/queries";
import { Notice, Loading, button, primary } from "../admin/ConsoleUI";

const statusLabels: Record<string, string> = { PUBLISHED: "Upcoming event", ONGOING: "Happening now", COMPLETED: "Event completed", CANCELLED: "Event cancelled" };
const registrationLabels: Record<string, string> = { REGISTERED: "You're on the guest list", WAITLISTED: "You're on the waitlist", ATTENDED: "Attendance confirmed", CANCELLED: "Registration cancelled", NO_SHOW: "Marked as absent" };
const text = (value: unknown) => String(value ?? "");
function dateLabel(value: unknown) {
  const date = new Date(`${text(value)}T00:00:00`);
  return Number.isNaN(date.getTime()) ? "Date to be announced" : date.toLocaleDateString("en-PH", { weekday: "long", month: "long", day: "numeric", year: "numeric" });
}
function timeLabel(value: unknown) {
  const [hour, minute] = text(value).split(":").map(Number);
  return Number.isFinite(hour) && Number.isFinite(minute) ? `${hour % 12 || 12}:${String(minute).padStart(2, "0")} ${hour < 12 ? "AM" : "PM"}` : "TBA";
}

export default function EventDetails({ event, loading, loadError, retry, pending, error, message, onAction }: {
  event: Row | null; loading: boolean; loadError: unknown; retry: () => void;
  pending: boolean; error: unknown; message: string; onAction: (cancel: boolean) => void;
}) {
  const status = text(event?.status);
  const registration = text(event?.registration_status);
  const registrationRequired = event?.registration_required !== false;
  const slots = Math.max(0, Number(event?.available_slots) || 0);
  const capacity = Math.max(0, Number(event?.capacity) || 0);
  const registered = Math.max(0, Number(event?.current_registered) || 0);
  const poster = text(event?.poster_image || event?.banner_image);
  const start = Date.parse(`${text(event?.event_date)}T${text(event?.start_time)}Z`);
  const opens = event?.registration_opens_at ? Date.parse(text(event.registration_opens_at)) : null;
  const closes = event?.registration_closes_at ? Date.parse(text(event.registration_closes_at)) : null;
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);
  const windowClosed = start <= now || (closes !== null && closes <= now);
  const windowNotOpen = opens !== null && opens > now;
  const canRegister = registrationRequired && status === "PUBLISHED" && (!registration || registration === "CANCELLED");
  const canCancel = registrationRequired && status === "PUBLISHED" && ["REGISTERED", "WAITLISTED"].includes(registration);
  const unavailable = windowClosed || windowNotOpen || (!slots && !event?.allow_waitlist);

  return <Dialog.Content className="fixed left-1/2 top-1/2 z-[81] flex max-h-[92dvh] w-[calc(100%-24px)] max-w-5xl -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-3xl border border-white/15 bg-[#111214] text-neutral-200 shadow-2xl">
    <div className="flex shrink-0 items-center justify-between gap-4 border-b border-white/10 px-5 py-4 sm:px-8">
      <p className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[.2em] text-amber-300"><Ticket className="h-4 w-4" />ACLCxp <span className="text-neutral-600">/</span> Campus experiences</p>
      <Dialog.Close disabled={pending} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/15 bg-white/5 transition hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300 disabled:opacity-40" aria-label="Close event details"><X className="h-4 w-4" /></Dialog.Close>
    </div>
    <div className="overflow-y-auto overscroll-contain">
      <header className="relative overflow-hidden border-b border-white/10 bg-gradient-to-br from-amber-300/10 via-neutral-900 to-neutral-950 px-5 py-7 sm:px-8 sm:py-9">
        <div className="relative max-w-3xl">
          <div className="mb-4 flex flex-wrap items-center gap-2 text-[10px] font-bold uppercase tracking-wider">
            {status && <span className={`rounded-full border px-3 py-1.5 ${status === 'CANCELLED' ? 'border-rose-300/20 bg-rose-300/10 text-rose-300' : 'border-amber-300/20 bg-amber-300/10 text-amber-200'}`}>{statusLabels[status] || status}</span>}
            {Boolean(event?.category_name) && <span className="rounded-full border border-white/15 px-3 py-1.5 text-neutral-300">{text(event?.category_name)}</span>}
          </div>
          <Dialog.Title className="break-words text-3xl font-extrabold leading-tight tracking-tight text-white sm:text-4xl">{text(event?.title) || 'Event details'}</Dialog.Title>
          <Dialog.Description className="mt-3 text-sm leading-6 text-neutral-400">Your guide to the event, from the first details to your place in the crowd.</Dialog.Description>
        </div>
      </header>
      {loadError ? <div className="p-6"><Notice error={loadError} retry={retry} /></div> : loading ? <Loading /> : event && <>
        <div className="grid gap-7 p-5 sm:p-8 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
          <div className="min-w-0 space-y-7">
            {poster ? <figure className="overflow-hidden rounded-2xl border border-white/10 bg-black/30">
              <img src={poster} alt={`${text(event.title)} event poster`} className="max-h-[560px] w-full object-contain" />
              <figcaption className="flex items-center justify-between gap-3 border-t border-white/10 px-4 py-3 text-xs text-neutral-400"><span>Event {event.poster_image ? 'poster' : 'background'}</span></figcaption>
            </figure> : <div className="flex aspect-[16/9] flex-col items-center justify-center rounded-2xl border border-white/10 bg-gradient-to-br from-amber-300/10 to-neutral-950"><CalendarDays className="mb-4 h-12 w-12 text-amber-300/60" /><p className="text-xs font-medium uppercase tracking-[.2em] text-neutral-400">Your next campus experience</p></div>}
            <section><h3 className="text-lg font-semibold text-white">About this event</h3><p className="mt-3 whitespace-pre-wrap break-words text-sm leading-7 text-neutral-400">{text(event.description) || 'More details will be shared soon.'}</p></section>
          </div>
          <aside className="min-w-0 space-y-5">
            <section className="rounded-2xl border border-white/10 bg-white/[.025] p-5">
              <h3 className="mb-5 text-xs font-bold uppercase tracking-[.18em] text-neutral-500">The essentials</h3>
              <dl className="space-y-5">
                {[
                  { icon: CalendarDays, label: 'Date', value: dateLabel(event.event_date) },
                  { icon: Clock3, label: 'Time · UTC', value: `${timeLabel(event.start_time)} – ${timeLabel(event.end_time)}` },
                  { icon: MapPin, label: 'Venue', value: text(event.venue) || 'To be announced' },
                ].map(({ icon: Icon, label, value }) => <div key={label} className="flex gap-3"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/5 text-amber-300"><Icon className="h-4 w-4" /></span><div className="min-w-0"><dt className="text-[11px] text-neutral-500">{label}</dt><dd className="mt-1 break-words text-sm font-medium leading-5 text-neutral-200">{value}</dd></div></div>)}
              </dl>
            </section>
            <section className="rounded-2xl border border-amber-300/20 bg-amber-300/[.04] p-5">
              <div className="flex items-center gap-3"><Trophy className="h-5 w-5 text-amber-300" /><div><h3 className="text-sm font-semibold text-amber-200">Attendance</h3>{event.attendance_mode === "NONE" ? <p className="mt-1 text-xs text-neutral-400">No attendance required. This event does not award attendance points or count as an absence.</p> : <p className="mt-1 text-xs text-neutral-400">Earn <span className="font-semibold text-white">{text(event.participation_points)} points</span> for verified attendance. {event.attendance_mode === "DAILY" ? "One staff-approved QR scan covers eligible daily-approval events that day." : "Check in at this event."}</p>}</div></div>
            </section>
            <section className="rounded-2xl border border-white/10 bg-neutral-950/50 p-5">
              <div className="flex items-center justify-between gap-3"><h3 className="flex items-center gap-2 text-sm font-semibold text-white"><Users className="h-4 w-4 text-amber-300" />Attending this event</h3></div>
              {registration && <p className="mt-4 flex items-center gap-2 rounded-lg bg-white/5 p-3 text-xs text-amber-200"><CheckCircle2 className="h-4 w-4 shrink-0" />{registrationLabels[registration] || registration}</p>}
              {registrationRequired && <><p className="mt-4 text-sm text-neutral-400"><span className="text-2xl font-bold tracking-tight text-white">{slots}</span> {slots === 1 ? 'place' : 'places'} available{capacity > 0 ? ` / ${capacity}` : ''}</p>
              {capacity > 0 && <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/10" aria-hidden="true"><div className="h-full rounded-full bg-amber-300" style={{ width: `${Math.min(100, registered / capacity * 100)}%` }} /></div>}
              <p className="mt-3 text-xs leading-5 text-neutral-400">Registration reserves your place as an attendee. Player and contestant sign-ups are handled separately by the organizer.</p></>}
              {!registrationRequired && <div className="mt-4 rounded-xl border border-emerald-300/20 bg-emerald-300/5 p-4"><p className="text-sm font-semibold text-emerald-200">Open attendance · No registration needed</p><p className="mt-2 text-xs leading-6 text-neutral-400">{event.attendance_mode === "NONE" ? "No attendance scan is needed for this event." : event.attendance_mode === "DAILY" ? "Ask staff for daily approval using your student QR pass. Your redeemed season ticket will be checked and eligible events recorded in one scan." : "Bring your student QR pass. Staff will scan it to verify your redeemed season ticket and record your attendance and points in your account."} Event audience rules still apply. Player and contestant sign-ups are handled separately by the organizer.</p></div>}
              {canRegister && <button className={`${primary} mt-5 w-full`} disabled={pending || unavailable} onClick={() => onAction(false)}><Ticket className="h-4 w-4" />{pending ? 'Saving…' : windowNotOpen ? 'Registration opens soon' : windowClosed ? 'Registration closed' : slots ? 'Register to attend' : event.allow_waitlist ? 'Join attendance waitlist' : 'Event full'}</button>}
              {canCancel && <button className={`${button} mt-5 w-full`} disabled={pending} onClick={() => onAction(true)}>{pending ? 'Saving…' : 'Cancel registration'}</button>}
              {registrationRequired && !canRegister && !canCancel && <p className="mt-4 text-xs leading-5 text-neutral-500">{status === 'CANCELLED' ? 'This event has been cancelled.' : status === 'COMPLETED' ? 'This event has ended. Thank you for being part of campus life.' : 'Registration is not available for this event.'}</p>}
              {error != null && <div className="mt-4"><Notice error={error} /></div>}
              {message && <p role="status" className="mt-4 rounded-xl bg-emerald-400/10 p-3 text-sm leading-6 text-emerald-200">{message}</p>}
            </section>
          </aside>
        </div>
        <EventTeams teams={event.teams} />
        {['requirements', 'rules', 'prizes'].some(key => event[key]) && <div className="grid gap-4 border-t border-white/10 bg-black/10 p-5 sm:p-8 md:grid-cols-3">
          {[{ key: 'requirements', title: 'What to bring', icon: ClipboardList }, { key: 'rules', title: 'Know before you go', icon: ShieldCheck }, { key: 'prizes', title: 'Up for grabs', icon: Gift }].map(({ key, title, icon: Icon }) => event[key] ? <section key={key} className="min-w-0 rounded-xl border border-white/10 bg-white/[.02] p-5"><Icon className="mb-4 h-5 w-5 text-amber-300" /><h3 className="text-sm font-semibold text-white">{title}</h3><p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-neutral-400">{text(event[key])}</p></section> : null)}
        </div>}
      </>}
    </div>
  </Dialog.Content>;
}
