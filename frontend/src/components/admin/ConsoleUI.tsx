import { useId, useRef, useState } from "react";
import axios from "axios";
import { editorSections } from "./editorSections";
import ImageUpload from "./ImageUpload";
import EventTeamsEditor from "./EventTeamsEditor";
import type { ReactNode, FormEvent } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import {
  AlertCircle,
  Check,
  ClipboardList,
  Save,
  Trash2,
  ChevronLeft,
  ChevronRight,
  LoaderCircle,
  Plus,
  RefreshCw,
  Search,
  X,
} from "lucide-react";
import {
  useApi,
  useWrite,
  errorMessage,
  valueText,
} from "../../services/queries";
import type { Row, PageData } from "../../services/queries";

export const button =
  "inline-flex shrink-0 min-h-11 whitespace-nowrap items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[.04] px-4 py-2 text-sm font-medium text-neutral-200 transition hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 disabled:cursor-not-allowed disabled:opacity-50";
export const primary = `${button} !border-amber-400/20 !bg-amber-400 !text-neutral-950 hover:!bg-amber-300`;
export const danger = `${button} !border-rose-400/30 !bg-rose-500/15 !text-rose-200 hover:!bg-rose-500/25`;
export const positive = `${button} !border-emerald-400/30 !bg-emerald-500/15 !text-emerald-200 hover:!bg-emerald-500/25`;
export const secondary = `${button} !border-sky-400/30 !bg-sky-500/15 !text-sky-200 hover:!bg-sky-500/25`;
export const input =
  "w-full min-h-11 rounded-xl border border-white/15 bg-neutral-950 px-3 py-2 text-sm text-neutral-100 outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 disabled:opacity-50";
export function PageHeading({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children?: ReactNode;
}) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <p className="mb-2 text-[10px] font-semibold uppercase tracking-[.2em] text-amber-400">
          ACLCxp / Campus operations
        </p>
        <h1 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
          {title}
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-neutral-400">
          {description}
        </p>
      </div>
      {children}
    </header>
  );
}
export function Notice({
  error,
  retry,
}: {
  error: unknown;
  retry?: () => void;
}) {
  return (
    <div
      role="alert"
      className="flex flex-wrap items-center gap-3 rounded-xl border border-rose-400/20 bg-rose-400/10 p-4 text-sm text-rose-200"
    >
      <AlertCircle className="h-5 w-5 shrink-0" />
      <span className="min-w-0 flex-1 break-words">{errorMessage(error)}</span>
      {retry && (
        <button type="button" className={button} onClick={retry}>
          Retry
        </button>
      )}
    </div>
  );
}
export function Loading() {
  return (
    <div
      role="status"
      className="flex items-center justify-center gap-3 py-16 text-sm text-neutral-400"
    >
      <LoaderCircle className="h-5 w-5 animate-spin" />
      Loading records...
    </div>
  );
}
export function Badge({ value }: { value: unknown }) {
  return (
    <span className="inline-flex rounded-lg border border-white/10 bg-white/[.04] px-2 py-1 text-[11px] font-medium text-amber-200">
      {valueText(value).replaceAll("_", " ")}
    </span>
  );
}
export function Panel({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`min-w-0 rounded-2xl border border-white/10 bg-neutral-900/60 p-5 sm:p-6 ${className}`}
    >
      {children}
    </section>
  );
}
export interface Field {
  showWhen?: (values: Record<string, string>) => boolean;
  aspectRatio?: number;
  name: string;
  label: string;
  type?:
    | "teams"
    | "image"
    | "text"
    | "textarea"
    | "number"
    | "date"
    | "time"
    | "datetime-local"
    | "select"
    | "checkbox"
    | "json"
    | "email"
    | "password"
    | "lookup"
    | "multi"
    | "list";
  required?: boolean;
  options?: { label: string; value: string | number }[];
  endpoint?: string;
  optionLabel?: string;
  hint?: string;
  min?: number;
  max?: number;
  maxLength?: number;
  placeholder?: string;
}
function Lookup({
  field,
  value,
  onChange,
  id,
  invalid,
}: {
  id?: string;
  invalid?: boolean;
  field: Field;
  value: string;
  onChange: (value: string) => void;
}) {
  const [search, setSearch] = useState("");
  const query = useApi<PageData>(
    `${field.endpoint}${field.endpoint?.includes("?") ? "&" : "?"}page_size=30&search=${encodeURIComponent(search)}`,
  );
  return (
    <div className="space-y-2">
      <input
        aria-label={`Search ${field.label}`}
        className={input}
        placeholder={`Search ${field.label.toLowerCase()}...`}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />
      <select
        id={id}
        aria-invalid={invalid || undefined}
        aria-describedby={id ? `${id}-help` : undefined}
        aria-label={field.label}
        className={input}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={field.required}
      >
        <option value="">{field.required ? "Select an option…" : "None / not set"}</option>
        {value && !query.data?.data.some((r) => String(r.id) === value) && (
          <option value={value}>Selected record #{value}</option>
        )}
        {query.data?.data.map((row) => (
          <option key={row.id} value={row.id}>
            {valueText(row[field.optionLabel || "name"])}
            {row.student_id ? ` / ${row.student_id}` : ""}
          </option>
        ))}
      </select>
      {query.isError && (
        <Notice error={query.error} retry={() => void query.refetch()} />
      )}
      {query.isPending && <p className="text-xs text-neutral-500">Loading options…</p>}
    </div>
  );
}
export function Editor({
  title,
  description = "Changes are saved to the shared campus records.",
  fields,
  initial = {},
  path,
  method = "post",
  onClose,
  transform,
  destructive = method === "delete",
}: {
  title: string;
  description?: string;
  fields: Field[];
  initial?: Record<string, unknown>;
  path: string;
  method?: "post" | "patch" | "delete";
  onClose: () => void;
  destructive?: boolean;
  transform?: (data: Record<string, unknown>) => Record<string, unknown>;
}) {
  const [values, setValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(
      fields.map((f) => [
        f.name,
        f.type === "teams" || f.type === "json" || f.type === "multi"
          ? JSON.stringify(initial[f.name] ?? [])
          : f.type === "list"
            ? Array.isArray(initial[f.name])
              ? (initial[f.name] as unknown[]).join(", ")
              : String(initial[f.name] ?? "")
            : f.type === "checkbox"
              ? String(initial[f.name] ?? false)
              : f.type === "datetime-local" && initial[f.name]
                ? (() => {
                    const date = new Date(String(initial[f.name]));
                    return new Date(
                      date.getTime() - date.getTimezoneOffset() * 60000,
                    )
                      .toISOString()
                      .slice(0, 16);
                  })()
                : String(initial[f.name] ?? ""),
      ]),
    ),
  );
  const [baseline] = useState(values);
  const [error, setError] = useState<unknown>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const errorRef = useRef<HTMLDivElement>(null);
  const id = useId();
  const limits = useApi<Record<string, Record<string, number>>>("/admin/field-limits/", fields.length > 0);
  const resource = Object.keys(limits.data || {}).sort((a, b) => b.length - a.length).find(prefix => path.startsWith(prefix));
  const fieldLimit = (field: Field) => field.maxLength ?? (resource ? limits.data?.[resource]?.[field.name] : undefined)
    ?? (["reason", "notes"].includes(field.name) ? 1000 : undefined);
  const sections = editorSections(path, fields);
  const isLong = fields.length > 6;
  const dirty = Object.keys(values).some(key => values[key] !== baseline[key]);
  const recordName = String(initial.title || initial.full_name || initial.name || initial.student_number || initial.key || "");
  const write = useWrite();
  const change = (name: string, value: string) => {
    setValues(old => ({ ...old, [name]: value }));
    setFieldErrors(old => ({ ...old, [name]: "" }));
  };
  async function submit(e: FormEvent) {
    e.preventDefault();
    if (write.isPending) return;
    setError(null);
    setFieldErrors({});
    try {
      const data: Record<string, unknown> = {};
      for (const field of fields) {
        if (field.showWhen && !field.showWhen(values)) continue;
        const value = values[field.name];
        const limit = fieldLimit(field);
        if (limit && value.length > limit) throw new Error(`${field.label} must be at most ${limit} characters.`);
        if (field.type === "image" && value === String(initial[field.name] ?? "")) continue;
        if (field.type === "password" && !value) continue;
        if (["date", "time"].includes(field.type || "") && !field.required && !value) { data[field.name] = null; continue; }
        data[field.name] =
          field.type === "teams" || field.type === "json" || field.type === "multi"
            ? JSON.parse(value || "[]")
            : field.type === "list"
              ? value
                  .split(",")
                  .map((v) => v.trim())
                  .filter(Boolean)
              : field.type === "checkbox"
                ? value === "true"
                : field.type === "number" || field.type === "lookup"
                  ? value
                    ? Number(value)
                    : null
                  : field.type === "datetime-local"
                    ? value
                      ? new Date(value).toISOString()
                      : null
                    : value;
      }
      if (Array.isArray(data.teams)) data.teams = data.teams.map(team => {
        const entry = { ...team };
        if (entry.photo && !entry.photo.startsWith("data:")) delete entry.photo;
        return entry;
      });
      if (Array.isArray(data.teams) && new Blob([JSON.stringify(data)]).size > 15 * 1024 * 1024) {
        throw new Error("These photos are too large to save together. Use smaller photos, or add a few house teams at a time and save between batches.");
      }
      await write.mutateAsync({
        path,
        method,
        body: transform ? transform(data) : data,
      });
      onClose();
    } catch (err) {
      setError(err);
      if (axios.isAxiosError(err)) {
        const response = err.response?.data;
        const errors = response?.errors || response;
        if (errors && typeof errors === "object") {
          setFieldErrors(Object.fromEntries(fields.filter(field => errors[field.name]).map(field => [field.name, Array.isArray(errors[field.name]) ? errors[field.name].join(" ") : String(errors[field.name])])));
        }
      }
      requestAnimationFrame(() => errorRef.current?.focus());
    }
  }
  function renderField(field: Field) {
    if (field.showWhen && !field.showWhen(values)) return null;
    const fieldId = `${id}-${field.name}`;
    const wide = ["teams", "textarea", "json", "image", "multi", "checkbox", "password"].includes(field.type || "") || ["description", "title", "reason", "notes", "value"].includes(field.name);
    const common = { maxLength: fieldLimit(field), id: fieldId, "aria-describedby": `${fieldId}-help`, "aria-invalid": !!fieldErrors[field.name], required: field.required, className: `${input} ${fieldErrors[field.name] ? '!border-rose-400/60' : ''}` };
    const label = <label htmlFor={fieldId} className="text-sm font-medium text-neutral-200">{field.label}{field.required && <span className="ml-1 text-amber-300" aria-label="required">*</span>}</label>;
    return <div key={field.name} className={`min-w-0 space-y-2 ${wide ? 'sm:col-span-2' : ''}`}>
      {field.type !== "checkbox" && <div className="flex items-start justify-between gap-3">{label}{!field.required && <span className="pt-0.5 text-[10px] text-neutral-500">Optional</span>}</div>}
      {field.type === "teams" ? <EventTeamsEditor value={values[field.name]} onChange={value => change(field.name, value)} />
      : field.type === "image" ? <ImageUpload id={fieldId} label={field.label} aspectRatio={field.aspectRatio} value={values[field.name]} onChange={value => change(field.name, value)} />
      : field.type === "lookup" ? <Lookup id={fieldId} invalid={!!fieldErrors[field.name]} field={field} value={values[field.name]} onChange={value => change(field.name, value)} />
      : field.type === "checkbox" ? <label className="flex cursor-pointer items-center justify-between gap-4 rounded-xl border border-white/10 bg-neutral-950/40 p-4" htmlFor={fieldId}><span><span className="block text-sm font-medium text-neutral-200">{field.label}</span><span className="mt-1 block text-xs text-neutral-500">{values[field.name] === 'true' ? 'Enabled' : 'Disabled'}</span></span><input id={fieldId} required={field.required} type="checkbox" checked={values[field.name] === 'true'} onChange={e => change(field.name, String(e.target.checked))} className="h-5 w-5 shrink-0 accent-amber-400" /></label>
      : field.type === "multi" ? <fieldset id={fieldId} aria-label={field.label} className="grid gap-2 rounded-xl border border-white/10 bg-neutral-950/40 p-3 sm:grid-cols-2">{field.options?.map(option => {
          const selected: (string | number)[] = JSON.parse(values[field.name] || '[]');
          const checked = selected.includes(option.value);
          return <label key={option.value} className={`flex min-h-11 cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-sm ${checked ? 'bg-amber-300/10 text-amber-200' : 'text-neutral-400 hover:bg-white/5'}`}><input type="checkbox" className="h-4 w-4 accent-amber-300" checked={checked} onChange={() => change(field.name, JSON.stringify(checked ? selected.filter(value => value !== option.value) : [...selected, option.value]))} />{option.label}</label>;
        })}{!field.options?.length && <p className="text-xs text-neutral-500">No options available.</p>}</fieldset>
      : field.type === "select" ? <select {...common} value={values[field.name]} onChange={e => change(field.name, e.target.value)}><option value="">Choose an option…</option>{field.options?.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}</select>
      : field.type === "textarea" || field.type === "json" ? <textarea {...common} className={`${common.className} min-h-28 resize-y leading-6`} placeholder={field.placeholder} value={values[field.name]} onChange={e => change(field.name, e.target.value)} />
      : <input {...common} type={field.type === 'list' ? 'text' : field.type || 'text'} min={field.min} max={field.max} placeholder={field.placeholder} value={values[field.name]} autoComplete={field.type === 'password' ? 'new-password' : 'off'} onChange={e => change(field.name, e.target.value)} />}
      <div id={`${fieldId}-help`} className="space-y-1">{fieldLimit(field) && <p className={`text-xs ${values[field.name].length > fieldLimit(field)! ? "text-rose-300" : "text-neutral-500"}`}>{values[field.name].length} / {fieldLimit(field)} characters</p>}{field.hint && <p className="text-xs leading-5 text-neutral-500">{field.hint.replace(' Hold Ctrl/Command to select multiple.', ' Select any that apply.')}</p>}{fieldErrors[field.name] && <p className="text-xs text-rose-300">{fieldErrors[field.name]}</p>}</div>
    </div>;
  }
  return (
    <Dialog.Root
      open
      onOpenChange={(open) => {
        if (!open && !write.isPending) onClose();
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[80] bg-black/70 backdrop-blur-sm" />
        <Dialog.Content className={`admin-dialog fixed left-1/2 top-1/2 z-[81] flex max-h-[92dvh] w-[calc(100%-24px)] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-2xl border border-white/15 bg-[#111315] text-neutral-200 shadow-2xl ${isLong ? 'max-w-5xl' : 'max-w-2xl'}`}>
          <header className="flex shrink-0 items-start justify-between gap-4 border-b border-white/10 bg-gradient-to-r from-white/[.04] to-transparent p-5 sm:px-7">
            <div className="flex min-w-0 items-start gap-4">
              <span className={`hidden h-11 w-11 shrink-0 items-center justify-center rounded-xl border sm:flex ${destructive ? 'border-rose-400/20 bg-rose-400/10 text-rose-300' : 'border-amber-300/20 bg-amber-300/10 text-amber-300'}`}>{destructive ? <Trash2 className="h-5 w-5" /> : <ClipboardList className="h-5 w-5" />}</span>
              <div className="min-w-0"><p className="mb-1 text-[9px] font-bold uppercase tracking-[.2em] text-neutral-500">Campus administration</p><Dialog.Title className="text-xl font-semibold tracking-tight text-white">{title}</Dialog.Title><Dialog.Description className="mt-2 max-w-2xl text-xs leading-5 text-neutral-400">{description}</Dialog.Description>{recordName && <p className="mt-2 break-words text-xs font-medium text-amber-200">{recordName}</p>}</div>
            </div>
            <Dialog.Close disabled={write.isPending} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-white/10 text-neutral-400 hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-amber-300 disabled:opacity-40" aria-label="Close dialog"><X className="h-4 w-4" /></Dialog.Close>
          </header>
          <form onSubmit={submit} className="flex min-h-0 flex-1 flex-col" aria-busy={write.isPending}>
            <div className="flex min-h-0 flex-1">
              {isLong && sections.length > 1 && <nav aria-label="Form sections" className="hidden w-48 shrink-0 space-y-1 overflow-y-auto border-r border-white/10 bg-black/10 p-4 lg:block"><p className="mb-3 px-2 text-[9px] font-bold uppercase tracking-widest text-neutral-500">In this form</p>{sections.map((section, index) => <button key={section.title} type="button" onClick={() => document.getElementById(`${id}-section-${index}`)?.scrollIntoView({ block: 'start', behavior: 'instant' })} className="flex w-full items-start gap-2 rounded-lg p-2 text-left text-xs leading-5 text-neutral-400 hover:bg-white/5 hover:text-amber-200 focus-visible:outline-2 focus-visible:outline-amber-300"><span className="font-mono text-[10px] text-amber-300/70">{String(index + 1).padStart(2, '0')}</span>{section.title}</button>)}</nav>}
              <div className="min-w-0 flex-1 overflow-y-auto overscroll-contain p-4 sm:p-6">
                {error != null && <div ref={errorRef} tabIndex={-1} className="mb-5 rounded-xl outline-none"><Notice error={error} /></div>}
                {fields.length > 0 && <p className="mb-5 text-[11px] text-neutral-500"><span className="text-amber-300">*</span> Required fields · Review each section before saving</p>}
                <fieldset disabled={write.isPending} className="min-w-0 space-y-5 disabled:opacity-60">
                  {sections.map((section, index) => <section key={section.title} id={`${id}-section-${index}`} className="scroll-mt-4 rounded-xl border border-white/10 bg-white/[.015] p-4 sm:p-5" aria-labelledby={`${id}-heading-${index}`}>
                    <div className="mb-5 border-b border-white/5 pb-4"><h3 id={`${id}-heading-${index}`} className="text-sm font-semibold text-white"><span className="mr-2 font-mono text-[10px] text-amber-300/80">{String(index + 1).padStart(2, '0')}</span>{section.title}</h3><p className="mt-1.5 text-xs leading-5 text-neutral-500">{section.description}</p></div>
                    <div className={`grid grid-cols-1 items-start gap-x-5 gap-y-4 sm:grid-cols-2 ${section.fields.length === 1 ? "[&>div]:col-span-full" : ""}`}>{section.fields.map(renderField)}</div>
                  </section>)}
                </fieldset>
                {!fields.length && <div className={`flex items-start gap-3 rounded-xl border p-4 text-sm leading-6 ${destructive ? 'border-rose-400/20 bg-rose-400/5 text-rose-200' : 'border-amber-300/20 bg-amber-300/5 text-amber-200'}`}><AlertCircle className="mt-0.5 h-5 w-5 shrink-0" /><p>{destructive ? 'Review the record above. Confirming permanently deletes it.' : 'Review the action above, then confirm to apply the change.'}</p></div>}
              </div>
            </div>
            <footer className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-t border-white/10 bg-[#151719] px-5 py-4 sm:px-7">
              <span className="hidden items-center gap-2 text-[11px] text-neutral-500 sm:flex"><span className={`h-1.5 w-1.5 rounded-full ${dirty ? 'bg-amber-300' : 'bg-neutral-600'}`} />{write.isPending ? 'Saving your changes…' : dirty ? 'Unsaved changes' : 'Changes apply when you save'}</span>
              <div className="ml-auto flex w-full flex-wrap justify-end gap-2 sm:w-auto"><button type="button" disabled={write.isPending} className={button} onClick={onClose}>Cancel</button><button type="submit" disabled={write.isPending} className={destructive ? `${button} !border-rose-400/30 !bg-rose-500 !text-white hover:!bg-rose-400` : primary}>{write.isPending ? <LoaderCircle className="h-4 w-4 animate-spin" /> : destructive ? <Trash2 className="h-4 w-4" /> : fields.length ? <Save className="h-4 w-4" /> : <Check className="h-4 w-4" />}{write.isPending ? 'Saving…' : destructive ? 'Confirm deletion' : fields.length ? 'Save changes' : 'Confirm action'}</button></div>
            </footer>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
export type Column = {
  key: string;
  label: string;
  render?: (row: Row) => ReactNode;
};
export function Records({
  endpoint,
  columns,
  actions,
  refreshKey = 0,
  searchValue,
  onSearchChange,
}: {
  endpoint: string;
  columns: Column[];
  actions?: (row: Row) => ReactNode;
  refreshKey?: number;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
}) {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const query = useApi<PageData>(
    `${endpoint}${endpoint.includes("?") ? "&" : "?"}page=${page}&search=${encodeURIComponent(searchValue ?? search)}&refresh=${refreshKey}`,
  );
  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-neutral-900/60">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 p-4">
        <label className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-3.5 h-4 w-4 text-neutral-500" />
          <input
            className={`${input} !pl-10`}
            aria-label="Search records"
            placeholder="Search records..."
            value={searchValue ?? search}
            onChange={(e) => {
              setSearch(e.target.value);
              onSearchChange?.(e.target.value);
              setPage(1);
            }}
          />
        </label>
        <button
          className={button}
          onClick={() => void query.refetch()}
          aria-label="Refresh records"
        >
          <RefreshCw
            className={`h-4 w-4 ${query.isFetching ? "animate-spin" : ""}`}
          />
          Refresh
        </button>
      </div>
      {query.isPending ? (
        <Loading />
      ) : query.isError ? (
        <div className="p-4">
          <Notice error={query.error} retry={() => void query.refetch()} />
        </div>
      ) : (
        <>
          <div className="overflow-x-auto overscroll-x-contain" tabIndex={0} role="region" aria-label="Records table, scroll horizontally for more columns">
            <table className="w-full text-left text-sm">
              <thead className="bg-neutral-950/40 text-[11px] uppercase tracking-wider text-neutral-500">
                <tr>
                  {columns.map((col) => (
                    <th
                      scope="col"
                      key={col.key}
                      className="whitespace-nowrap px-5 py-4 font-medium"
                    >
                      {col.label}
                    </th>
                  ))}
                  {actions && (
                    <th scope="col" className="sticky right-0 z-10 w-px whitespace-nowrap bg-neutral-950 px-5 py-4 text-right font-medium">
                      Actions
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[.05]">
                {query.data.data.map((row) => (
                  <tr key={row.id} className="group bg-[#111111] transition hover:bg-[#181818]">
                    {columns.map((col) => (
                      <td
                        key={col.key}
                        className="max-w-sm px-5 py-4 text-neutral-300"
                      >
                        <div className="break-words">
                          {col.render
                            ? col.render(row)
                            : valueText(row[col.key])}
                        </div>
                      </td>
                    ))}
                    {actions && (
                      <td className="sticky right-0 w-px bg-[#111111] px-5 py-3 align-middle transition group-hover:bg-[#181818]">
                        <div className="ml-auto flex w-max max-w-40 flex-wrap items-center justify-end gap-2 sm:max-w-[22rem]">
                          {actions(row)}
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
            {!query.data.data.length && (
              <div className="px-5 py-16 text-center">
                <p className="font-medium text-neutral-300">No records found</p>
                <p className="mt-2 text-sm text-neutral-500">
                  Try another search or add your first record.
                </p>
              </div>
            )}
          </div>
          <footer className="flex items-center justify-between gap-3 border-t border-white/10 p-4 text-xs text-neutral-500">
            <span>
              {query.data.count} records / Page {page}
            </span>
            <div className="flex gap-2">
              <button
                aria-label="Previous page"
                className={button}
                disabled={!query.data.previous}
                onClick={() => setPage(page - 1)}
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                aria-label="Next page"
                className={button}
                disabled={!query.data.next}
                onClick={() => setPage(page + 1)}
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </footer>
        </>
      )}
    </div>
  );
}
export function ResourcePage({
  title,
  description,
  endpoint,
  listEndpoint,
  columns,
  fields = [],
  defaults = {},
  canCreate = false,
  canEdit = false,
  canDelete = false,
  deleteDescription = "This cannot be undone. Records with protected history cannot be deleted.",
  extraActions,
  children,
}: {
  title: string;
  description: string;
  endpoint: string;
  listEndpoint?: string;
  columns: Column[];
  fields?: Field[];
  defaults?: Record<string, unknown>;
  canCreate?: boolean;
  canEdit?: boolean | ((row: Row) => boolean);
  canDelete?: boolean | ((row: Row) => boolean);
  deleteDescription?: string;
  extraActions?: (row: Row) => ReactNode;
  children?: ReactNode;
}) {
  const [edit, setEdit] = useState<Row | "new" | null>(null);
  const [remove, setRemove] = useState<Row | null>(null);
  return (
    <div className="space-y-6">
      <PageHeading title={title} description={description}>
        {canCreate && (
          <button className={primary} onClick={() => setEdit("new")}>
            <Plus className="h-4 w-4" />
            Add record
          </button>
        )}
      </PageHeading>
      {children}
      <Records
        key={listEndpoint || endpoint}
        endpoint={listEndpoint || endpoint}
        columns={columns}
        actions={
          canEdit || canDelete || extraActions
            ? (row) => (
                <>
                  {(typeof canEdit === "function" ? canEdit(row) : canEdit) && (
                    <button className={secondary} onClick={() => setEdit(row)}>
                      Edit
                    </button>
                  )}
                  {(typeof canDelete === "function"
                    ? canDelete(row)
                    : canDelete) && (
                    <button className={danger} onClick={() => setRemove(row)}>
                      Delete
                    </button>
                  )}
                  {extraActions?.(row)}
                </>
              )
            : undefined
        }
      />
      {edit && (
        <Editor
          title={
            edit === "new"
              ? `Add ${title.toLowerCase()}`
              : `Edit ${title.toLowerCase()}`
          }
          description={description}
          path={edit === "new" ? endpoint : `${endpoint}${edit.id}/`}
          method={edit === "new" ? "post" : "patch"}
          fields={fields}
          initial={edit === "new" ? defaults : edit}
          onClose={() => setEdit(null)}
        />
      )}
      {remove && (
        <Editor
          title={`Delete ${String(remove.ticket_number || remove.full_name || remove.name || remove.student_number || "record")}?`}
          description={deleteDescription}
          fields={[]}
          method="delete"
          path={`${endpoint}${remove.id}/`}
          onClose={() => setRemove(null)}
        />
      )}
    </div>
  );
}
