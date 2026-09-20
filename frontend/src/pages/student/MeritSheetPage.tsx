import { useState } from "react";
import { CalendarDays, CheckCircle2, Clock3, XCircle, Search, ChevronLeft, ChevronRight, Award } from "lucide-react";
import { StudentFrame } from "../../components/dashboard/LivePortal";
import { Records, Loading, Notice, input, button } from "../../components/admin/ConsoleUI";
import { useApi, type PageData } from "../../services/queries";

type AttendanceRow = {
  id: number; event_title: string; category: string; event_date: string; start_time: string;
  status: string; detail: string; signed_by: string | null; scanned_at: string | null; validation_notes: string;
};
type Overview = PageData<AttendanceRow> & {
  summary: { attended: number; absent: number; pending: number; invalid: number; total: number; rate: number; season: string; points: number };
};
const statuses: Record<string, { label: string; color: string }> = {
  NOT_REQUIRED: { label: "Not required", color: "border-white/10 bg-white/5 text-neutral-400" },
  ATTENDED: { label: "Attended", color: "border-emerald-400/20 bg-emerald-400/10 text-emerald-300" },
  ABSENT: { label: "Absent", color: "border-rose-400/20 bg-rose-400/10 text-rose-300" },
  PENDING: { label: "Pending", color: "border-amber-400/20 bg-amber-400/10 text-amber-300" },
  INVALID: { label: "Invalidated", color: "border-rose-400/20 bg-rose-400/10 text-rose-300" },
  WAITLISTED: { label: "Waitlisted", color: "border-sky-400/20 bg-sky-400/10 text-sky-300" },
  CANCELLED: { label: "Cancelled", color: "border-white/10 bg-white/5 text-neutral-400" },
};
function eventDate(row: AttendanceRow) {
  return new Date(`${row.event_date}T${row.start_time}Z`);
}
export default function MeritSheetPage() {
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const query = useApi<Overview>(`/portal/attendance-overview/?page=${page}&status=${status}&search=${encodeURIComponent(search)}`);
  const summary = query.data?.summary;
  return (
    <StudentFrame>
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm text-amber-300">Your participation, recorded</p>
          <h1 className="mt-2 text-3xl font-semibold text-white">Merit sheet</h1>
          <p className="mt-2 text-sm text-neutral-400">A clear view of your attendance, participation, and earned points.</p>
        </div>
        {summary && <span className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs text-neutral-300">{summary.season}</span>}
      </header>
      {query.isPending ? <Loading /> : query.isError ? <Notice error={query.error} retry={() => void query.refetch()} /> : summary && <>
        <section aria-label="Merit overview" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: "Verified attendance", value: summary.attended, icon: CheckCircle2, color: "text-emerald-300", hint: "Events you checked in to" },
            { label: "Pending events", value: summary.pending, icon: Clock3, color: "text-amber-300", hint: "Upcoming or ongoing" },
            { label: "Absent", value: summary.absent, icon: XCircle, color: "text-rose-300", hint: "Completed without a check-in" },
            { label: "Effective points", value: summary.points, icon: Award, color: "text-amber-300", hint: "From approved school records" },
          ].map(({ label, value, icon: Icon, color, hint }) => <div key={label} className="rounded-2xl border border-white/10 bg-neutral-900/60 p-5">
            <div className="flex items-center justify-between gap-2 text-sm text-neutral-400">{label}<Icon aria-hidden="true" className={`h-5 w-5 ${color}`} /></div>
            <p className="mt-4 text-3xl font-semibold tabular-nums text-white">{value.toLocaleString()}</p>
            <p className="mt-2 text-xs text-neutral-500">{hint}</p>
          </div>)}
        </section>
        <section className="overflow-hidden rounded-2xl border border-white/10 bg-neutral-900/60" aria-labelledby="attendance-title">
          <div className="border-b border-white/10 p-5 sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div><h2 id="attendance-title" className="text-lg font-semibold text-white">My attendance record</h2><p className="mt-1 text-sm text-neutral-400">Total events attended: <span className="font-medium text-white">{summary.attended} / {summary.total}</span></p></div>
              <span className="text-3xl font-semibold tabular-nums text-amber-300">{summary.rate}<span className="text-base">%</span></span>
            </div>
            <div role="progressbar" aria-label="Attendance rate" aria-valuenow={summary.rate} aria-valuemin={0} aria-valuemax={100} className="mt-5 h-2 overflow-hidden rounded-full bg-white/5"><div className="h-full rounded-full bg-amber-400 transition-all" style={{ width: `${summary.rate}%` }} /></div>
            <p className="mt-3 text-xs leading-5 text-neutral-500">Current-season registrations and check-ins. Pending and invalidated attendance count toward the total; cancelled, waitlisted, and attendance-exempt events do not.</p>
          </div>
          <div className="flex flex-col gap-3 border-b border-white/10 p-5 sm:flex-row">
            <div className="relative flex-1"><Search aria-hidden="true" className="absolute left-3 top-3.5 h-4 w-4 text-neutral-500" /><input aria-label="Search attendance events" className={`${input} pl-10`} placeholder="Search an event..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} /></div>
            <select aria-label="Filter attendance status" className={`${input} sm:max-w-48`} value={status} onChange={e => { setStatus(e.target.value); setPage(1); }}><option value="">All statuses</option>{Object.entries(statuses).map(([key, value]) => <option key={key} value={key}>{value.label}</option>)}</select>
          </div>
          <div className="hidden grid-cols-[1.4fr_1fr_1.2fr] gap-4 border-b border-white/10 px-6 py-3 text-xs font-medium uppercase tracking-wider text-neutral-500 md:grid"><span>Event name</span><span>Date & time</span><span>Status & verification</span></div>
          <ul className="divide-y divide-white/10">
            {query.data.data.map(row => {
              const badge = statuses[row.status];
              return <li key={row.id} className="grid gap-4 p-5 md:grid-cols-[1.4fr_1fr_1.2fr] md:px-6">
                <div className="flex items-start gap-3"><span className="rounded-xl border border-white/10 bg-white/5 p-2.5"><CalendarDays aria-hidden="true" className="h-5 w-5 text-amber-300" /></span><div><p className="font-medium text-white">{row.event_title}</p><p className="mt-1 text-xs text-neutral-500">{row.category}</p></div></div>
                <div className="text-sm text-neutral-300"><p>{eventDate(row).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}</p><p className="mt-1 text-xs text-neutral-500">{eventDate(row).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit", timeZoneName: "short" })}</p></div>
                <div><span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${badge.color}`}>{row.status === "ATTENDED" ? <CheckCircle2 className="h-3.5 w-3.5" /> : row.status === "ABSENT" || row.status === "INVALID" ? <XCircle className="h-3.5 w-3.5" /> : <Clock3 className="h-3.5 w-3.5" />}{badge.label}</span><p className="mt-2 text-xs text-neutral-400">{row.status === "ATTENDED" ? `Signed by: ${row.signed_by || "Verifier unavailable"}` : row.detail}</p>{row.scanned_at && <p className="mt-1 text-xs text-neutral-500">Check-in: {new Date(row.scanned_at).toLocaleString()}</p>}{row.validation_notes && <p className="mt-1 text-xs text-neutral-400">{row.validation_notes}</p>}</div>
              </li>;
            })}
          </ul>
          {!query.data.data.length && <div className="px-6 py-12 text-center"><CalendarDays className="mx-auto h-8 w-8 text-neutral-600" /><p className="mt-3 text-sm text-neutral-300">{search || status ? "No events match your filters." : "Your attendance story starts here."}</p><p className="mt-2 text-xs text-neutral-500">{search || status ? "Try another status or event name." : "Register for an event to see it in your merit sheet."}</p></div>}
          <div className="flex items-center justify-between gap-3 border-t border-white/10 p-5 text-xs text-neutral-500"><span aria-live="polite">{query.data.count} events · Page {page}</span><div className="flex gap-2"><button className={button} disabled={!query.data.previous} onClick={() => setPage(page - 1)} aria-label="Previous attendance page"><ChevronLeft className="h-4 w-4" /></button><button className={button} disabled={!query.data.next} onClick={() => setPage(page + 1)} aria-label="Next attendance page"><ChevronRight className="h-4 w-4" /></button></div></div>
        </section>
      </>}
      <section>
        <h2 className="mb-2 text-lg font-semibold text-white">Points history</h2>
        <p className="mb-4 text-sm text-neutral-400">The approved transactions behind your merit points.</p>
        <Records endpoint="/portal/merit/" columns={[
          { key: "created_at", label: "Date", render: r => new Date(String(r.created_at)).toLocaleDateString() },
          { key: "event_title", label: "Event" }, { key: "transaction_type", label: "Type" },
          { key: "reason", label: "Reason" }, { key: "points", label: "Points" },
        ]} />
      </section>
    </StudentFrame>
  );
}
