export const schoolZone = "Asia/Manila";
export function schoolTimestamp(value: string, includeTime = true) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Date unavailable";
  return date.toLocaleString("en-PH", { timeZone: schoolZone, dateStyle: "medium", ...(includeTime ? { timeStyle: "short" as const } : {}) });
}
export function eventSchedule(date: unknown, start: unknown, end?: unknown) {
  // Event date/time fields are stored in UTC by the existing Django settings.
  const begins = new Date(`${String(date)}T${String(start)}Z`);
  if (Number.isNaN(begins.getTime())) return { date: "Schedule to be announced", time: "Time to be announced" };
  const time = (value: Date) => value.toLocaleTimeString("en-PH", { timeZone: schoolZone, hour: "numeric", minute: "2-digit" });
  const finishes = end ? new Date(`${String(date)}T${String(end)}Z`) : null;
  return { date: begins.toLocaleDateString("en-PH", { timeZone: schoolZone, weekday: "short", month: "short", day: "numeric", year: "numeric" }), time: `${time(begins)}${finishes && !Number.isNaN(finishes.getTime()) ? ` – ${time(finishes)}` : ""} PHT` };
}
export const registrationLabels: Record<string, string> = {
  REGISTERED: "Reservation confirmed", WAITLISTED: "Waitlisted", ATTENDED: "Attendance verified", CANCELLED: "Reservation cancelled", NO_SHOW: "Marked absent",
};
export const eventLabels: Record<string, string> = { PUBLISHED: "Upcoming", ONGOING: "Happening now", COMPLETED: "Completed", CANCELLED: "Cancelled" };
export const attendanceStatuses: Record<string, { label: string; color: string; next: string }> = {
  ATTENDED: { label: "Attended", color: "border-emerald-300/25 bg-emerald-300/10 text-emerald-200", next: "Your attendance has been verified." },
  PENDING: { label: "Awaiting check-in", color: "border-amber-300/25 bg-amber-300/10 text-amber-200", next: "Bring your student QR pass and check in with staff when you attend." },
  ABSENT: { label: "Absent", color: "border-rose-300/25 bg-rose-300/10 text-rose-200", next: "If you attended, ask the event organizer to review your record." },
  INVALID: { label: "Needs review", color: "border-rose-300/25 bg-rose-300/10 text-rose-200", next: "This attendance was invalidated. Ask the organizer about a correction." },
  WAITLISTED: { label: "Waitlisted", color: "border-sky-300/25 bg-sky-300/10 text-sky-200", next: "Your attendance reservation is not confirmed yet. Check the event for updates." },
  CANCELLED: { label: "Cancelled", color: "border-white/15 bg-white/5 text-neutral-300", next: "This reservation or event was cancelled." },
  NOT_REQUIRED: { label: "No check-in required", color: "border-white/15 bg-white/5 text-neutral-300", next: "This event does not require attendance or award attendance points." },
};
