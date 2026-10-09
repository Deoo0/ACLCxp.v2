import { useEffect, useState } from "react";
import { CalendarDays, Check, ChevronLeft, ChevronRight, RefreshCw, Search } from "lucide-react";
import { useApi, type PageData, type Row } from "../../services/queries";
import { input, button, Loading, Notice, Badge } from "./ConsoleUI";

export default function AttendanceEventPicker({ value, onChange, checkIn = false, archive = "active", year = "", disabled = false }: {
  value: Row | null; onChange: (event: Row | null) => void; checkIn?: boolean; archive?: string; year?: string; disabled?: boolean;
}) {
  const [search, setSearch] = useState("");
  const [term, setTerm] = useState("");
  const [page, setPage] = useState(1);
  useEffect(() => {
    if (search.trim() === term) return;
    const timer = setTimeout(() => { setTerm(search.trim()); setPage(1); }, 250);
    return () => clearTimeout(timer);
  }, [search, term]);
  const params = new URLSearchParams({ page: String(page), page_size: "12", archive, year, search: term });
  if (checkIn) { params.set("status", "ONGOING"); params.set("attendance_mode", "PER_EVENT"); }
  const query = useApi<PageData>(`/events/?${params}`, !value);
  if (value) return <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-300/25 bg-amber-300/5 p-4">
    <div className="min-w-0"><p className="text-xs text-amber-300">{checkIn ? "Selected event" : "Report event"}</p><p className="mt-1 break-words font-semibold text-white">{String(value.title)}</p><p className="mt-1 text-xs text-neutral-400">{String(value.venue || "Venue not set")} · {String(value.event_date || "")}</p></div>
    <button type="button" className={button} disabled={disabled} onClick={() => onChange(null)}>{checkIn ? "Change event" : "Show all events"}</button>
  </div>;
  return <div className="space-y-3">
    <div className="flex items-center gap-2"><label className="relative min-w-0 flex-1"><Search className="absolute left-3 top-3.5 h-4 w-4 text-neutral-500" aria-hidden="true" /><input aria-label={checkIn ? "Search ongoing check-in events" : "Search report events"} placeholder="Search event name" className={`${input} !pl-10`} value={search} disabled={disabled} onChange={e => setSearch(e.target.value)} /></label><button type="button" className={button} aria-label="Refresh events" onClick={() => void query.refetch()}><RefreshCw className={`h-4 w-4 ${query.isFetching ? "animate-spin" : ""}`} /></button></div>
    {query.isPending ? <Loading /> : query.isError ? <Notice error={query.error} retry={() => void query.refetch()} /> : <>
      {!query.data.data.length && <div className="rounded-xl border border-dashed border-white/15 p-5 text-sm text-neutral-400">{term ? "No matching events. Try another name." : checkIn ? "No ongoing events use individual check-in. Use Daily approval for daily events, or start an event from Events." : "No events match these report filters."}</div>}
      <div className="grid gap-2 sm:grid-cols-2">{query.data.data.map(event => <button type="button" key={event.id} disabled={disabled} onClick={() => onChange(event)} className="flex min-h-20 items-center gap-3 rounded-xl border border-white/10 bg-white/[.025] p-4 text-left outline-none transition hover:border-amber-300/40 focus-visible:ring-2 focus-visible:ring-amber-300 disabled:opacity-50">
        <CalendarDays className="h-5 w-5 shrink-0 text-amber-300" aria-hidden="true" /><div className="min-w-0 flex-1"><p className="break-words text-sm font-medium text-white">{String(event.title)}</p><p className="mt-1 text-xs text-neutral-400">{String(event.event_date)} · {String(event.venue || "Venue not set")}</p>{!checkIn && <span className="mt-2 inline-block"><Badge value={event.status} /></span>}</div><Check className="h-4 w-4 shrink-0 text-neutral-500" aria-hidden="true" />
      </button>)}</div>
      {(query.data.next || query.data.previous) && <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-neutral-400"><span>{query.data.count} events · Page {page}</span><div className="flex min-w-0 flex-wrap gap-2"><button type="button" className={button} disabled={!query.data.previous} onClick={() => setPage(page - 1)}><ChevronLeft className="h-4 w-4" />Previous events</button><button type="button" className={button} disabled={!query.data.next} onClick={() => setPage(page + 1)}>More events<ChevronRight className="h-4 w-4" /></button></div></div>}
    </>}
  </div>;
}
