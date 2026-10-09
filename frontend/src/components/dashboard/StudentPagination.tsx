import { ChevronLeft, ChevronRight } from "lucide-react";
import { button } from "../admin/ConsoleUI";
export default function StudentPagination({ page, count, previous, next, onChange, label, busy = false }: {
  page: number; count: number; previous: string | null; next: string | null; onChange: (page: number) => void; label: string; busy?: boolean;
}) {
  if (!count) return null;
  return <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 p-4 text-xs text-neutral-400"><span aria-live="polite">{count.toLocaleString()} {label} · Page {page}</span><div className="flex gap-2"><button type="button" className={button} disabled={busy || !previous} onClick={() => onChange(page - 1)} aria-label={`Previous ${label} page`}><ChevronLeft className="h-4 w-4" /></button><button type="button" className={button} disabled={busy || !next} onClick={() => onChange(page + 1)} aria-label={`Next ${label} page`}><ChevronRight className="h-4 w-4" /></button></div></footer>;
}
