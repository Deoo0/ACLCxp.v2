import { imageVariant, imageSrcSet } from "../../services/images";
import { eventSchedule, eventLabels, registrationLabels } from "../../services/studentExperience";
import EventTeams from "./EventTeams";
import * as Dialog from "@radix-ui/react-dialog";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { CalendarDays, Clock3, MapPin, Trophy, Ticket, X, CheckCircle2, QrCode } from "lucide-react";
import type { Row } from "../../services/queries";
import { Notice, Loading, button, primary } from "../admin/ConsoleUI";

const text = (value: unknown) => String(value ?? "");
export default function EventDetails({ event, loading, loadError, retry, pending, error, message, onAction, onShowPass }: {
  event: Row | null; loading: boolean; loadError: unknown; retry: () => void;
  pending: boolean; error: unknown; message: string; onAction: (cancel: boolean) => void; onShowPass: () => void;
}) {
  const status = text(event?.status), registration = text(event?.registration_status);
  const registrationRequired = event?.registration_required !== false;
  const noAttendance = event?.attendance_mode === "NONE";
  const slots = Math.max(0, Number(event?.available_slots) || 0);
  const poster = text(event?.poster_image || event?.banner_image);
  const start = Date.parse(`${text(event?.event_date)}T${text(event?.start_time)}Z`);
  const opens = event?.registration_opens_at ? Date.parse(text(event.registration_opens_at)) : null;
  const closes = event?.registration_closes_at ? Date.parse(text(event.registration_closes_at)) : null;
  const [now, setNow] = useState(() => Date.now());
  const [confirmCancel, setConfirmCancel] = useState(false);
  useEffect(() => { const timer = window.setInterval(() => setNow(Date.now()), 15000); return () => window.clearInterval(timer); }, []);
  const windowClosed = start <= now || (closes !== null && closes <= now);
  const windowNotOpen = opens !== null && opens > now;
  const canRegister = registrationRequired && status === "PUBLISHED" && (!registration || registration === "CANCELLED");
  const canCancel = registrationRequired && status === "PUBLISHED" && start > now && ["REGISTERED", "WAITLISTED"].includes(registration);
  const unavailable = windowClosed || windowNotOpen || (!slots && !event?.allow_waitlist);
  const canShowPass = !noAttendance && ["PUBLISHED", "ONGOING"].includes(status) && (!registrationRequired || registration === "REGISTERED");
  const schedule = eventSchedule(event?.event_date, event?.start_time, event?.end_time);
  const ready = !!event && !loading && !loadError;
  return <Dialog.Content className="fixed left-1/2 top-1/2 z-[81] flex max-h-[92dvh] w-[calc(100%-24px)] max-w-4xl -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-2xl border border-white/15 bg-neutral-900 text-neutral-200 shadow-2xl">
    <header className="flex shrink-0 items-start justify-between gap-3 border-b border-white/10 p-4 sm:p-6"><div className="min-w-0"><Dialog.Title className="break-words text-xl font-semibold text-white sm:text-2xl">{text(event?.title) || "Event details"}</Dialog.Title><Dialog.Description className="mt-2 text-xs leading-5 text-neutral-400">Check the schedule and attendance requirements before reserving a place.</Dialog.Description></div><Dialog.Close disabled={pending} className={button} aria-label="Close event details"><X className="h-4 w-4" /></Dialog.Close></header>
    <div className="min-h-0 overflow-y-auto overscroll-contain p-4 sm:p-6">
      {loadError ? <Notice error={loadError} retry={retry} /> : loading ? <Loading /> : event && <div className="space-y-5">
        <div className="flex flex-wrap gap-2 text-xs"><span className="rounded-full border border-amber-300/25 bg-amber-300/10 px-3 py-1.5 text-amber-200">{eventLabels[status] || status}</span>{!!event.category_name && <span className="rounded-full border border-white/15 px-3 py-1.5 text-neutral-300">{text(event.category_name)}</span>}{registration && <span className="flex items-center gap-2 rounded-full border border-white/15 px-3 py-1.5 text-neutral-200"><CheckCircle2 className="h-3.5 w-3.5" />{registrationLabels[registration] || registration}</span>}</div>
        <dl className="grid gap-3 rounded-xl border border-white/10 bg-white/[.025] p-4 sm:grid-cols-2">{[{ icon: CalendarDays, label: "Date (Philippine time)", value: schedule.date }, { icon: Clock3, label: "Time", value: schedule.time }, { icon: MapPin, label: "Venue", value: text(event.venue) || "To be announced" }, { icon: Trophy, label: "Attendance points", value: noAttendance ? "No attendance points or check-in" : `${Number(event.participation_points || 0)} points after staff verify attendance` }].map(({ icon: Icon, label, value }) => <div key={label} className="flex items-start gap-3"><Icon className="mt-1 h-4 w-4 shrink-0 text-amber-300" /><div className="min-w-0"><dt className="text-xs text-neutral-400">{label}</dt><dd className="mt-1 break-words text-sm leading-6 text-white">{value}</dd></div></div>)}</dl>
        <section className="space-y-3 rounded-xl border border-amber-300/20 bg-amber-300/5 p-4"><h3 className="font-semibold text-white">What you need to do</h3><p className="text-sm leading-6 text-neutral-300">{status === "CANCELLED" ? "This event was cancelled. No new reservations or check-ins are available." : status === "COMPLETED" ? "This event has ended. Check your merit record for verified attendance and points." : registration === "ATTENDED" ? "Your attendance has been verified by staff." : registration === "WAITLISTED" ? "You are on the waitlist. Your attendance place is not confirmed yet; check My reservations for updates." : registration === "REGISTERED" ? noAttendance ? "Your place is reserved. No attendance scan is required for this event." : "Your attendance place is reserved. Bring your live or downloaded student QR pass and check in with staff." : registrationRequired ? noAttendance ? "Reserve your place if registration is open. This event does not require an attendance scan." : "Reserve an attendance place if registration is open, then check in with staff when you attend." : noAttendance ? "No reservation or attendance scan is required." : "No reservation needed. Bring your student QR pass and ask staff to check you in."}</p>
          {!noAttendance && !["CANCELLED", "COMPLETED"].includes(status) && event.attendance_mode === "DAILY" && <p className="text-xs leading-5 text-neutral-400">Staff use daily approval: one verified QR scan covers the eligible daily events. Ticket, audience, and reservation requirements still apply.</p>}
          {registrationRequired && ["PUBLISHED", "ONGOING"].includes(status) && <p className="text-xs text-neutral-300">{slots ? `${slots} attendance ${slots === 1 ? "place" : "places"} available` : event.allow_waitlist ? "Attendance places are full. A waitlist is available while registration is open." : "Attendance places are full."}</p>}
          <p className="text-xs leading-5 text-neutral-400">Reservations are for attendance. Player and contestant sign-ups are handled separately by the organizer. Points are awarded only after staff verification or an approved award.</p>
        </section>
        <section><h3 className="font-semibold text-white">About this event</h3><p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-neutral-300">{text(event.description) || "More details will be shared soon."}</p></section>
        {poster && <details className="rounded-xl border border-white/10 p-4"><summary className="cursor-pointer text-sm font-medium text-neutral-200">View event poster</summary><img src={imageVariant(poster, 1280)} srcSet={imageSrcSet(poster)} sizes="(min-width: 768px) 768px, 100vw" decoding="async" loading="lazy" alt={`${text(event.title)} event poster`} className="mt-4 max-h-[560px] w-full object-contain" /></details>}
        {[{ key: "requirements", title: "What to bring" }, { key: "rules", title: "Rules" }, { key: "prizes", title: "Prizes" }].map(({ key, title }) => event[key] ? <details key={key} className="rounded-xl border border-white/10 p-4"><summary className="cursor-pointer text-sm font-medium text-neutral-200">{title}</summary><p className="mt-3 whitespace-pre-wrap break-words text-sm leading-6 text-neutral-300">{text(event[key])}</p></details> : null)}
        <EventTeams teams={event.teams} />
      </div>}
    </div>
    {ready && <footer className="max-h-[50dvh] shrink-0 space-y-3 overflow-y-auto border-t border-white/10 bg-neutral-950/80 p-4 sm:p-5">
      {error != null && <Notice error={error} />}{message && <p role="status" className="rounded-xl border border-emerald-300/20 bg-emerald-300/5 p-3 text-sm leading-6 text-emerald-200">{message}</p>}
      {confirmCancel && canCancel ? <div className="space-y-3"><p className="text-sm leading-6 text-neutral-200">Cancel your attendance reservation? Your reserved place or waitlist entry will be released.</p><div className="flex flex-wrap gap-2"><button type="button" className={button} disabled={pending} onClick={() => setConfirmCancel(false)}>Keep reservation</button><button type="button" className={`${button} !border-rose-300/30 !text-rose-200`} disabled={pending} onClick={() => { setConfirmCancel(false); onAction(true); }}>Confirm cancellation</button></div></div> : <div className="flex flex-wrap gap-2">
        {canRegister && <button type="button" className={`${primary} w-full sm:w-auto`} disabled={pending || unavailable} onClick={() => onAction(false)}><Ticket className="h-4 w-4" />{pending ? "Saving…" : windowNotOpen ? "Registration opens soon" : windowClosed ? "Registration closed" : slots ? "Reserve attendance place" : event?.allow_waitlist ? "Join waitlist" : "Event full"}</button>}
        {canShowPass && <button type="button" className={`${primary} w-full sm:w-auto`} disabled={pending} onClick={onShowPass}><QrCode className="h-4 w-4" />Show my QR pass</button>}
        {canCancel && <button type="button" className={button} disabled={pending} onClick={() => setConfirmCancel(true)}>Cancel reservation</button>}
        {(registration === "ATTENDED" || status === "COMPLETED") && <Link className={button} to="/merit">View my merit</Link>}
        <Dialog.Close className={button} disabled={pending}>Close</Dialog.Close>
      </div>}
    </footer>}
  </Dialog.Content>;
}
