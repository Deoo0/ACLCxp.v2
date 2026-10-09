import { useCallback, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ScanLine, RefreshCw } from "lucide-react";
import api from "../../services/api";
import { useApi, useWrite, errorMessage, type Row } from "../../services/queries";
import { Panel, Notice, Loading, input, button, primary, Badge } from "./ConsoleUI";
import VerificationFeedback, { type VerificationState } from "../feedback/VerificationFeedback";
import AttendanceEventPicker from "./AttendanceEventPicker";
import IdentityConfirmation, { type StudentIdentity } from "./IdentityConfirmation";
import QRScanner from "./QRScanner";

export default function EventAttendance() {
  const [event, setEvent] = useState<Row | null>(null);
  const [student, setStudent] = useState("");
  const [scanner, setScanner] = useState(false);
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState<VerificationState | null>(null);
  const [pendingIdentity, setPendingIdentity] = useState<{ student: StudentIdentity; token?: string; student_id: string } | null>(null);
  const inFlight = useRef(false);
  const studentInput = useRef<HTMLInputElement>(null);
  const detail = useApi<Row>(`/events/${event?.id}/`, !!event);
  const selected = detail.data;
  const available = !!selected && !detail.isError && selected.status === "ONGOING" && !selected.archived_at && selected.attendance_mode === "PER_EVENT";
  const { mutateAsync } = useWrite();
  const submit = useCallback(async (token?: string, identity_proof?: string, verifiedStudent?: string) => {
    if (inFlight.current || !available || !event) return;
    inFlight.current = true; setBusy(true); setScanner(false); setFeedback(null);
    try {
      if (!identity_proof) {
        const student_id = student.trim();
        const response = await api.post<StudentIdentity>("/attendance/preview/", token ? { token } : { student_id });
        setPendingIdentity({ student: response.data, token, student_id });
        return;
      }
      setPendingIdentity(null);
      const row = await mutateAsync({ path: "/admin/attendance/check_in/", body: { event: event.id, identity_proof, ...(token ? { token } : { student_id: verifiedStudent || student.trim() }) } });
      setFeedback({ kind: "success", title: "Attendance confirmed", message: `${row.student_name} is checked in to ${event.title}. Repeat scans do not duplicate attendance or points.` });
      setStudent(""); requestAnimationFrame(() => studentInput.current?.focus());
    } catch (error) { setPendingIdentity(null); setFeedback({ kind: "error", title: "Attendance not recorded", message: errorMessage(error) }); }
    finally { inFlight.current = false; setBusy(false); }
  }, [available, event, student, mutateAsync]);
  const onScan = useCallback((token: string) => { void submit(token); }, [submit]);
  return <Panel>
    <h2 className="text-lg font-semibold text-white">Event check-in</h2>
    <p className="mt-2 text-sm leading-6 text-neutral-400">Choose an ongoing event, then scan a student or enter their number. Only events using individual check-in appear here.</p>
    <div className="mt-5 space-y-5">
      <div><p className="mb-3 text-xs font-semibold uppercase tracking-wider text-amber-300">1. Choose an event</p><AttendanceEventPicker value={event} checkIn disabled={busy || !!pendingIdentity} onChange={value => { setEvent(value); setScanner(false); setFeedback(null); setPendingIdentity(null); }} /></div>
      {!event && <Link className="inline-block text-sm text-amber-300 underline underline-offset-4" to="/admin/events">Manage or start an event</Link>}
      {event && (detail.isPending ? <Loading /> : detail.isError ? <Notice error={detail.error} retry={() => void detail.refetch()} /> : <>
        <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-neutral-300"><div className="flex flex-wrap items-center gap-3"><Badge value={selected?.status} /><span>{Number(selected?.participation_points || 0)} participation points</span><span>{selected?.registration_required ? "Attendance reservation required" : "No reservation needed"}</span></div><button type="button" className={button} disabled={busy} onClick={() => void detail.refetch()}><RefreshCw className={`h-4 w-4 ${detail.isFetching ? "animate-spin" : ""}`} />Refresh event</button></div>
        {!available && <p role="status" className="rounded-xl border border-amber-300/20 bg-amber-300/5 p-4 text-sm text-amber-200">This event is no longer available for individual check-in. Choose another ongoing event, or use Daily approval if its attendance mode has changed.</p>}
        <div className="rounded-2xl border border-white/10 bg-white/[.025] p-4 sm:p-5"><p className="mb-4 text-xs font-semibold uppercase tracking-wider text-amber-300">2. Find a student</p>
          <button type="button" className={`${primary} min-h-14 w-full sm:w-auto`} disabled={!available || busy || !!pendingIdentity} onClick={() => { setFeedback(null); setScanner(!scanner); }}><ScanLine className="h-5 w-5" />{scanner ? "Close camera" : "Scan QR pass"}</button>
          {scanner && <div className="mx-auto my-4 max-w-sm"><QRScanner onScan={onScan} /></div>}
          <form className="mt-4 flex flex-wrap items-end gap-3" onSubmit={e => { e.preventDefault(); if (student.trim()) void submit(); }}><label className="block min-w-0 flex-1 text-sm text-neutral-300">Or enter a student number<input ref={studentInput} required className={`${input} mt-2`} value={student} disabled={busy || !!pendingIdentity} onChange={e => setStudent(e.target.value)} placeholder="Enter the school student number" autoComplete="off" /></label><button className={`${button} w-full sm:w-auto`} disabled={!available || busy || !!pendingIdentity || !student.trim()}>{busy ? "Checking student…" : "Find student"}</button></form>
          <p className="mt-3 text-xs leading-5 text-neutral-400">Verify the student against their school ID before saving. Staff need internet to check eligibility and record attendance.</p>
        </div>
      </>)}
      {busy && <VerificationFeedback kind="pending" title="Checking attendance" message="Please wait while the student details or attendance are checked." />}
      {feedback && <VerificationFeedback {...feedback} />}
      {feedback?.kind === "success" && <button type="button" className={button} disabled={!available || busy} onClick={() => { setFeedback(null); setScanner(true); }}><ScanLine className="h-4 w-4" />Scan next student</button>}
    </div>
    {pendingIdentity && <IdentityConfirmation context={`Event · ${String(event?.title)}`} student={pendingIdentity.student} onCancel={() => { setPendingIdentity(null); requestAnimationFrame(() => studentInput.current?.focus()); }} onConfirm={() => void submit(pendingIdentity.token, pendingIdentity.student.identity_proof, pendingIdentity.student_id)} />}
  </Panel>;
}
