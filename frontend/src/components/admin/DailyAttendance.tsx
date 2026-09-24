import { useCallback, useRef, useState } from "react";
import { ScanLine } from "lucide-react";
import { useApi, useWrite } from "../../services/queries";
import { Panel, Notice, Loading, input, button, primary } from "./ConsoleUI";
import VerificationFeedback from "../feedback/VerificationFeedback";
import { errorMessage } from "../../services/queries";
import QRScanner from "./QRScanner";

type EventItem = { id: number; title: string; registration_required: boolean; points: number };
type Result = { student_name: string; approved: { id: number; title: string }[]; already_recorded: { id: number; title: string }[]; skipped: { id: number; title: string; reason: string }[] };
const schoolToday = () => new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Manila", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());

export default function DailyAttendance() {
  const [date, setDate] = useState(schoolToday);
  const [student, setStudent] = useState("");
  const [scanner, setScanner] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState<unknown>(null);
  const inFlight = useRef(false);
  const query = useApi<{ events: EventItem[] }>(`/attendance/daily/?date=${date}`, !!date);
  const write = useWrite();
  const mutateAsync = write.mutateAsync;
  const submit = useCallback(async (token?: string) => {
    if (inFlight.current) return;
    inFlight.current = true;
    setScanner(false); setError(null); setResult(null);
    try {
      const response = await mutateAsync({ path: "/attendance/daily/", body: { date, ...(token ? { token } : { student_id: student.trim() }) } });
      setResult(response); setStudent("");
    } catch (err) { setError(err); }
    finally { inFlight.current = false; }
  }, [date, student, mutateAsync]);
  const onScan = useCallback((token: string) => { void submit(token); }, [submit]);
  const available = !!date && !query.isPending && !query.isError && !!query.data?.events.length;
  return <Panel>
    <h2 className="text-lg font-semibold text-white">Daily attendance approval</h2>
    <p className="mt-2 text-sm leading-6 text-neutral-400">Confirm that the student attended on this date, then scan once to approve the events below. Each event receives its own attendance record and points. Repeat scans do not duplicate either.</p>
    <div className="mt-5 grid gap-5 lg:grid-cols-2">
      <div className="space-y-3">
        <label className="block text-sm text-neutral-300">Attendance date (Philippine time)<input type="date" className={`${input} mt-2`} value={date} max={schoolToday()} disabled={write.isPending} onChange={e => { setDate(e.target.value); setScanner(false); setResult(null); setError(null); }} /></label>
        <p className="text-xs leading-5 text-neutral-500">Only events set to Daily approval that have already started are included. Cancelled, archived, future, and attendance-exempt events are excluded. Ticket, audience, and reservation requirements still apply.</p>
        {!date ? <p className="text-sm text-neutral-400">Choose a date.</p> : query.isPending ? <Loading /> : query.isError ? <Notice error={query.error} retry={() => void query.refetch()} /> : <ul className="space-y-2">{query.data.events.map(event => <li key={event.id} className="rounded-xl border border-white/10 bg-white/5 p-3 text-sm"><p className="text-neutral-200">{event.title}</p><p className="mt-1 text-xs text-neutral-400">{event.points} points · {event.registration_required ? "Attendance reservation required" : "No reservation needed"}</p></li>)}{!query.data.events.length && <li className="text-sm text-neutral-400">No events are available for daily approval on this date.</li>}</ul>}
      </div>
      <form className="space-y-3" onSubmit={e => { e.preventDefault(); if (available) void submit(); }}>
        <label className="block text-sm text-neutral-300">Student number<input className={`${input} mt-2`} required value={student} disabled={write.isPending} onChange={e => setStudent(e.target.value)} placeholder="For manual staff approval" /></label>
        <div className="flex flex-wrap gap-2"><button className={primary} disabled={!available || write.isPending}>{write.isPending ? "Approving…" : "Approve attendance for the day"}</button><button type="button" className={button} disabled={!available || write.isPending} onClick={() => { setResult(null); setError(null); setScanner(!scanner); }}><ScanLine className="h-4 w-4" />{scanner ? "Close camera" : "Scan once for the day"}</button></div>
        {scanner && <div className="mx-auto max-w-sm"><QRScanner onScan={onScan} /></div>}
      </form>
    </div>
    {write.isPending && <div className="mt-4"><VerificationFeedback kind="pending" title="Checking attendance" message="Please wait while attendance is verified and saved." /></div>}{error != null && <div className="mt-4"><VerificationFeedback kind="error" title="Attendance not approved" message={errorMessage(error)} /></div>}{result && <div className="mt-4"><VerificationFeedback kind={result.approved.length ? "success" : result.already_recorded.length ? "info" : "error"} title={result.approved.length ? "Attendance approved" : result.already_recorded.length ? "Attendance already recorded" : "No attendance approved"} message={`${result.student_name}: ${result.approved.length} approved, ${result.already_recorded.length} already recorded, ${result.skipped.length} skipped. Review the event details below.`} /></div>}
    {result && <div className="mt-5 rounded-xl border border-white/10 bg-white/5 p-4 text-sm"><p className="font-semibold text-white">{result.student_name || "Daily approval result"}: {result.approved.length} approved · {result.already_recorded.length} already recorded · {result.skipped.length} skipped</p><ul className="mt-3 space-y-2">{result.approved.map(event => <li key={event.id} className="text-emerald-300">Approved: {event.title}</li>)}{result.already_recorded.map(event => <li key={event.id} className="text-neutral-400">Already recorded: {event.title}</li>)}{result.skipped.map(event => <li key={event.id} className="text-amber-200">Skipped: {event.title} — {event.reason}</li>)}</ul></div>}
  </Panel>;
}
