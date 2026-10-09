import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { CalendarDays, ScanLine, ClipboardList, Download, SlidersHorizontal } from "lucide-react";
import { PageHeading, Panel, Records, Editor, button, Notice, Badge } from "../../components/admin/ConsoleUI";
import DailyAttendance from "../../components/admin/DailyAttendance";
import EventAttendance from "../../components/admin/EventAttendance";
import AttendanceEventPicker from "../../components/admin/AttendanceEventPicker";
import { AccountFilters, ArchiveFilters, type Filters } from "../../components/admin/Filters";
import type { Row } from "../../services/queries";
import api from "../../services/api";
import { downloadBlob } from "../../services/download";

function AttendanceRecords() {
  const [archive, setArchive] = useState("active");
  const [year, setYear] = useState("");
  const [filters, setFilters] = useState<Filters>({});
  const [search, setSearch] = useState("");
  const [event, setEvent] = useState<Row | null>(null);
  const [correction, setCorrection] = useState<Row | null>(null);
  const [error, setError] = useState<unknown>(null);
  const [exporting, setExporting] = useState(false);
  const params = new URLSearchParams({ ...filters, archive, year, event: event ? String(event.id) : "" });
  const filterCount = Object.values(filters).filter(Boolean).length + (archive !== "active" ? 1 : 0) + (year ? 1 : 0) + (event ? 1 : 0);
  const exportRows = async () => {
    setExporting(true); setError(null);
    try {
      const response = await api.get(`/admin/attendance/export/?${params}&search=${encodeURIComponent(search)}`, { responseType: "blob", timeout: 120000 });
      downloadBlob(response.data, `attendance-${archive}-${year || "all-years"}.csv`);
    } catch (error) { setError(error); }
    finally { setExporting(false); }
  };
  return <div className="space-y-4">
    <Panel>
      <div className="flex flex-wrap items-start justify-between gap-4"><div><h2 className="text-lg font-semibold text-white">Attendance records</h2><p className="mt-2 text-sm leading-6 text-neutral-400">Search by student name, student number, or event. Review a record to void or restore attendance.</p></div><button type="button" className={button} disabled={exporting} onClick={() => void exportRows()}><Download className="h-4 w-4" />{exporting ? "Exporting…" : "Download CSV"}</button></div>
      <p className="mt-3 text-xs leading-5 text-neutral-400">CSV downloads include all matching records across every page. Check-in times below use Philippine time.</p>
      <details className="mt-5 rounded-xl border border-white/10 p-4"><summary className="cursor-pointer text-sm font-medium text-neutral-200"><span className="inline-flex items-center gap-2"><SlidersHorizontal className="h-4 w-4 text-amber-300" />Filters {filterCount > 0 && `(${filterCount} applied)`}</span></summary><div className="mt-4 space-y-5">
        <ArchiveFilters archive={archive} year={year} onChange={(a, y) => { setArchive(a); setYear(y); setEvent(null); }} />
        <AccountFilters values={filters} onChange={setFilters} attendance />
        <div><p className="mb-3 text-sm text-neutral-300">Filter by event (optional)</p><AttendanceEventPicker value={event} onChange={setEvent} archive={archive} year={year} /></div>
      </div></details>
      {filterCount > 0 && <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-sm"><p className="min-w-0 break-words text-neutral-400">{event ? String(event.title) : "All events"} · {filterCount} {filterCount === 1 ? "filter applied" : "filters applied"}</p><button type="button" className={button} onClick={() => { setArchive("active"); setYear(""); setFilters({}); setEvent(null); setSearch(""); }}>Reset filters</button></div>}
    </Panel>
    {error != null && <Notice error={error} />}
    <Records key={params.toString()} endpoint={`/admin/attendance/?${params}`} searchValue={search} onSearchChange={setSearch} searchPlaceholder="Student name, number, or event" emptyMessage="No attendance matches this search. Check your filters, or record a student from Daily approval or Event check-in." mobileCards columns={[
      { key: "student_name", label: "Student", render: row => <div><p className="font-medium text-white">{String(row.student_name || "Name unavailable")}</p><p className="mt-1 font-mono text-xs text-neutral-400">{String(row.student_id)}</p></div> },
      { key: "student_id", label: "Student number" },
      { key: "event_title", label: "Event" },
      { key: "scanned_at", label: "Check-in (PH time)", render: row => new Date(String(row.scanned_at)).toLocaleString("en-PH", { timeZone: "Asia/Manila", dateStyle: "medium", timeStyle: "short" }) },
      { key: "is_valid", label: "Status", render: row => <Badge value={row.is_valid ? "VALID" : "VOIDED"} /> },
    ]} actions={row => <button className={button} onClick={() => setCorrection(row)}>{row.is_valid ? "Void attendance" : "Restore attendance"}</button>} />
    {correction && <Editor title={`${correction.is_valid ? "Void" : "Restore"} attendance`} description={`${correction.student_name} · ${correction.student_id} · ${correction.event_title}. This also reverses or restores participation points and is recorded in the audit trail.`} fields={[{ name: "reason", label: "Reason for correction", type: "textarea", required: true }]} path={`/admin/attendance/${correction.id}/correct/`} transform={data => ({ ...data, is_valid: !correction.is_valid })} onClose={() => setCorrection(null)} />}
  </div>;
}

const views = [
  { id: "daily", label: "Daily approval", description: "One scan for the day's events", icon: CalendarDays },
  { id: "event", label: "Event check-in", description: "Check in to one ongoing event", icon: ScanLine },
  { id: "records", label: "Records", description: "Search, correct, and export", icon: ClipboardList },
];

export default function AttendanceReportsPage() {
  const [params] = useSearchParams();
  const view = views.some(item => item.id === params.get("view")) ? params.get("view") : "daily";
  return <div className="space-y-5">
    <PageHeading title="Attendance" description="Choose how to check in a student. Attendance is saved only after you verify their identity." />
    <nav aria-label="Attendance workflows" className="sticky top-[74px] z-20 grid grid-cols-3 gap-2 rounded-2xl border border-white/10 bg-neutral-950/95 p-2 backdrop-blur sm:gap-3">
      {views.map(({ id, label, description, icon: Icon }) => <Link key={id} to={`/admin/attendance?view=${id}`} onClick={() => window.scrollTo(0, 0)} aria-current={view === id ? "page" : undefined} className={`flex min-h-20 min-w-0 flex-col items-center justify-center gap-2 rounded-xl px-2 py-3 text-center text-xs font-medium outline-none transition focus-visible:ring-2 focus-visible:ring-amber-300 sm:items-start sm:px-4 sm:text-left sm:text-sm ${view === id ? "bg-amber-300/10 text-amber-200 ring-1 ring-amber-300/30" : "text-neutral-400 hover:bg-white/5 hover:text-white"}`}><span className="flex flex-col items-center gap-2 sm:flex-row"><Icon className="h-5 w-5 shrink-0" aria-hidden="true" /><span>{label}</span></span><span className="hidden text-xs font-normal text-neutral-400 sm:block">{description}</span></Link>)}
    </nav>
    {view === "daily" ? <DailyAttendance /> : view === "event" ? <EventAttendance /> : <AttendanceRecords />}
  </div>;
}
