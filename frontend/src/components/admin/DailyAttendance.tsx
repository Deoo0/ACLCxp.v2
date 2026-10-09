import api from "../../services/api";
import IdentityConfirmation, { type StudentIdentity } from "./IdentityConfirmation";
import { useCallback, useRef, useState } from "react";
import { CalendarDays, ScanLine, RefreshCw } from "lucide-react";
import { useApi, useWrite, errorMessage } from "../../services/queries";
import { Panel, Notice, Loading, input, button, primary } from "./ConsoleUI";
import VerificationFeedback from "../feedback/VerificationFeedback";
import QRScanner from "./QRScanner";

type EventItem = { id: number; title: string; registration_required: boolean; points: number };
type Result = { student_name: string; approved: { id: number; title: string }[]; already_recorded: { id: number; title: string }[]; skipped: { id: number; title: string; reason: string }[] };
const schoolToday = () => new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Manila", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());

export default function DailyAttendance() {
  const [date, setDate] = useState(schoolToday);
  const [student, setStudent] = useState("");
  const [scanner, setScanner] = useState(false);
  const [busy, setBusy] = useState(false);
  const [pendingIdentity, setPendingIdentity] = useState<{ student: StudentIdentity; token?: string; student_id: string } | null>(null);
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState<unknown>(null);
  const inFlight = useRef(false);
  const studentInput = useRef<HTMLInputElement>(null);
  const query = useApi<{ events: EventItem[] }>(`/attendance/daily/?date=${date}`, !!date);
  const write = useWrite();
  const mutateAsync = write.mutateAsync;
  const available = !!date && !query.isPending && !query.isError && !!query.data?.events.length;
  const submit = useCallback(async (token?: string, identity_proof?: string, verifiedStudent?: string) => {
    if (inFlight.current || !available) return;
    inFlight.current = true; setBusy(true);
    setScanner(false); setError(null); setResult(null);
    try {
      if (!identity_proof) {
        const student_id = student.trim();
        const response = await api.post<StudentIdentity>("/attendance/preview/", token ? { token } : { student_id });
        setPendingIdentity({ student: response.data, token, student_id });
        return;
      }
      setPendingIdentity(null);
      const response = await mutateAsync({ path: "/attendance/daily/", body: { identity_proof, date, ...(token ? { token } : { student_id: verifiedStudent || student.trim() }) } });
      setResult(response); setStudent(""); requestAnimationFrame(() => studentInput.current?.focus());
    } catch (err) { setPendingIdentity(null); setError(err); }
    finally { inFlight.current = false; setBusy(false); }
  }, [date, student, mutateAsync, available]);
  const onScan = useCallback((token: string) => { void submit(token); }, [submit]);
  const changeDate = (value: string) => { setPendingIdentity(null); setDate(value); setScanner(false); setResult(null); setError(null); };
  return <Panel>
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div><h2 className="text-lg font-semibold text-white">Daily attendance approval</h2><p className="mt-2 max-w-xl text-sm leading-6 text-neutral-400">Scan a student once to approve the eligible daily events for this date. Verify their identity before saving.</p></div>
      <button type="button" className={button} disabled={busy} onClick={() => void query.refetch()}><RefreshCw className={`h-4 w-4 ${query.isFetching ? "animate-spin" : ""}`} />Refresh events</button>
    </div>
    <div className="mt-5 max-w-md space-y-2">
        <div className="flex items-end gap-2"><label className="block min-w-0 flex-1 text-sm text-neutral-300">Attendance date<input type="date" className={`${input} mt-2`} value={date} max={schoolToday()} disabled={busy || !!pendingIdentity} onChange={e => changeDate(e.target.value)} aria-describedby="daily-date-help" /></label><button type="button" className={button} disabled={busy || !!pendingIdentity || date === schoolToday()} onClick={() => changeDate(schoolToday())}>Today</button></div>
        <p id="daily-date-help" className="text-xs text-neutral-400">Dates use Philippine time. Future attendance cannot be approved.</p>
    </div>
    <div className="mt-5 grid items-start gap-6 lg:grid-cols-2">
      <div className="order-2 space-y-4 lg:order-1">
        {!date ? <p className="text-sm text-neutral-400">Choose an attendance date to begin.</p> : query.isPending ? <Loading /> : query.isError ? <Notice error={query.error} retry={() => void query.refetch()} /> : <>
          <div className={`rounded-xl border p-4 ${available ? "border-emerald-300/20 bg-emerald-300/5" : "border-white/10 bg-white/[.025]"}`}><p className="flex items-center gap-2 text-sm font-medium text-white"><CalendarDays className="h-4 w-4 shrink-0 text-amber-300" />{query.data.events.length} {query.data.events.length === 1 ? "event available" : "events available"}</p><p className="mt-2 text-xs leading-5 text-neutral-400">{available ? "Each event gets its own attendance record and points. Ticket and reservation rules still apply." : "No daily events have started on this date. Try another date or use Event check-in for an ongoing individual event."}</p></div>
          {available && <details className="rounded-xl border border-white/10 p-4"><summary className="cursor-pointer text-sm font-medium text-neutral-200">Events covered ({query.data.events.length})</summary><ul className="mt-3 space-y-3">{query.data.events.map(event => <li key={event.id}><p className="text-sm text-white">{event.title}</p><p className="mt-1 text-xs text-neutral-400">{event.points} points · {event.registration_required ? "Attendance reservation required" : "No reservation needed"}</p></li>)}</ul></details>}
        </>}
      </div>
      <div className="order-1 space-y-4 rounded-2xl border border-white/10 bg-white/[.025] p-4 sm:p-5 lg:order-2">
        <p className="text-xs font-semibold uppercase tracking-wider text-amber-300">Check in a student</p>
        <button type="button" className={`${primary} min-h-14 w-full`} disabled={!available || busy || !!pendingIdentity} onClick={() => { setResult(null); setError(null); setScanner(!scanner); }}><ScanLine className="h-5 w-5" />{scanner ? "Close camera" : "Scan once for the day"}</button>
        <p className="text-center text-xs text-neutral-400">Use their live or downloaded QR pass.</p>
        {scanner && <div className="mx-auto max-w-sm"><QRScanner onScan={onScan} /></div>}
        <form className="space-y-3 border-t border-white/10 pt-4" onSubmit={e => { e.preventDefault(); if (available && student.trim()) void submit(); }}>
          <label className="block text-sm text-neutral-300">Or enter a student number<input ref={studentInput} className={`${input} mt-2`} required value={student} disabled={busy || !!pendingIdentity} onChange={e => setStudent(e.target.value)} placeholder="Enter the school student number" autoComplete="off" /></label>
          <button className={`${button} w-full`} disabled={!available || busy || !!pendingIdentity || !student.trim()}>{busy ? "Checking student…" : "Find student"}</button>
        </form>
        <p className="text-xs leading-5 text-neutral-400">Staff need internet to verify and save attendance. Repeat approvals do not duplicate records or points.</p>
    {busy && <div className="mt-4"><VerificationFeedback kind="pending" title="Checking attendance" message="Please wait while the student details or attendance are checked." /></div>}
    {error != null && <div className="mt-4"><VerificationFeedback kind="error" title="Attendance not approved" message={errorMessage(error)} /></div>}
    {result && <div className="mt-4 space-y-3"><VerificationFeedback kind={result.approved.length ? "success" : result.already_recorded.length ? "info" : "error"} title={result.approved.length ? "Attendance approved" : result.already_recorded.length ? "Attendance already recorded" : "No attendance approved"} message={`${result.student_name}: ${result.approved.length} approved, ${result.already_recorded.length} already recorded, ${result.skipped.length} skipped.`} />
      <button type="button" className={button} disabled={!available || busy} onClick={() => { setResult(null); setError(null); setScanner(true); }}><ScanLine className="h-4 w-4" />Scan next student</button>
      <details open={result.skipped.length > 0} className="rounded-xl border border-white/10 p-4 text-sm"><summary className="cursor-pointer font-medium text-white">Review approval results</summary><ul className="mt-3 space-y-2">{result.approved.map(event => <li key={event.id} className="text-emerald-300">Approved: {event.title}</li>)}{result.already_recorded.map(event => <li key={event.id} className="text-neutral-400">Already recorded: {event.title}</li>)}{result.skipped.map(event => <li key={event.id} className="text-amber-200">Skipped: {event.title} — {event.reason}</li>)}</ul></details>
    </div>}

      </div>
    </div>
    {pendingIdentity && <IdentityConfirmation context={`Daily approval · ${date} (Philippine time)`} student={pendingIdentity.student} onCancel={() => { setPendingIdentity(null); requestAnimationFrame(() => studentInput.current?.focus()); }} onConfirm={() => void submit(pendingIdentity.token, pendingIdentity.student.identity_proof, pendingIdentity.student_id)} />}
  </Panel>;
}
