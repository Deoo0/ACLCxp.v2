import { useState } from "react";
import ImageUpload from "./ImageUpload";
import type { ReactNode, FormEvent } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import {
  AlertCircle,
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
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[.04] px-4 py-2 text-sm font-medium text-neutral-200 transition hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 disabled:cursor-not-allowed disabled:opacity-50";
export const primary = `${button} !border-amber-400/20 !bg-amber-400 !text-neutral-950 hover:!bg-amber-300`;
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
        <button className={button} onClick={retry}>
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
      className={`rounded-2xl border border-white/10 bg-neutral-900/60 p-5 sm:p-6 ${className}`}
    >
      {children}
    </section>
  );
}
export interface Field {
  aspectRatio?: number;
  name: string;
  label: string;
  type?:
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
}
function Lookup({
  field,
  value,
  onChange,
}: {
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
        aria-label={field.label}
        className={input}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={field.required}
      >
        <option value="">Select {field.label.toLowerCase()}</option>
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
}: {
  title: string;
  description?: string;
  fields: Field[];
  initial?: Record<string, unknown>;
  path: string;
  method?: "post" | "patch" | "delete";
  onClose: () => void;
  transform?: (data: Record<string, unknown>) => Record<string, unknown>;
}) {
  const [values, setValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(
      fields.map((f) => [
        f.name,
        f.type === "json" || f.type === "multi"
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
  const [error, setError] = useState<unknown>(null);
  const write = useWrite();
  async function submit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      const data: Record<string, unknown> = {};
      for (const field of fields) {
        const value = values[field.name];
        if (field.type === "image" && value === String(initial[field.name] ?? "")) continue;
        if (field.type === "password" && !value) continue;
        data[field.name] =
          field.type === "json" || field.type === "multi"
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
      await write.mutateAsync({
        path,
        method,
        body: transform ? transform(data) : data,
      });
      onClose();
    } catch (err) {
      setError(err);
    }
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
        <Dialog.Content className="admin-dialog fixed left-1/2 top-1/2 z-[81] max-h-[90dvh] w-[calc(100%-24px)] max-w-2xl -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl border border-white/15 bg-neutral-900 p-5 text-neutral-200 shadow-2xl sm:p-7">
          <div className="flex items-start justify-between gap-4">
            <div>
              <Dialog.Title className="text-xl font-semibold text-white">
                {title}
              </Dialog.Title>
              <Dialog.Description className="mt-2 text-sm leading-6 text-neutral-400">
                {description}
              </Dialog.Description>
            </div>
            <Dialog.Close
              disabled={write.isPending}
              className={button}
              aria-label="Close dialog"
            >
              <X className="h-4 w-4" />
            </Dialog.Close>
          </div>
          <form onSubmit={submit} className="mt-6 space-y-4">
            {fields.map((field) => field.type === "image" ? (
              <div key={field.name} className="space-y-2 text-sm text-neutral-300">
                <p>{field.label}</p>
                <ImageUpload label={field.label} aspectRatio={field.aspectRatio} value={values[field.name]} onChange={value => setValues(old => ({ ...old, [field.name]: value }))} />
              </div>
            ) : (
              <label
                key={field.name}
                className="block space-y-2 text-sm text-neutral-300"
              >
                <span>
                  {field.label}
                  {field.required ? " *" : ""}
                </span>
                {field.type === "lookup" ? (
                  <Lookup
                    field={field}
                    value={values[field.name]}
                    onChange={(value) =>
                      setValues((old) => ({ ...old, [field.name]: value }))
                    }
                  />
                ) : field.type === "multi" ? (
                  <select
                    multiple
                    className={`${input} min-h-28`}
                    value={JSON.parse(values[field.name] || "[]").map(String)}
                    onChange={(e) =>
                      setValues({
                        ...values,
                        [field.name]: JSON.stringify(
                          Array.from(
                            e.target.selectedOptions,
                            (o) =>
                              field.options?.find(
                                (x) => String(x.value) === o.value,
                              )?.value,
                          ),
                        ),
                      })
                    }
                  >
                    {field.options?.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                ) : field.type === "select" ? (
                  <select
                    className={input}
                    required={field.required}
                    value={values[field.name]}
                    onChange={(e) =>
                      setValues({ ...values, [field.name]: e.target.value })
                    }
                  >
                    <option value="">Choose...</option>
                    {field.options?.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                ) : field.type === "checkbox" ? (
                  <input
                    type="checkbox"
                    className="ml-3 h-5 w-5 accent-amber-400"
                    checked={values[field.name] === "true"}
                    onChange={(e) =>
                      setValues({
                        ...values,
                        [field.name]: String(e.target.checked),
                      })
                    }
                  />
                ) : field.type === "textarea" || field.type === "json" ? (
                  <textarea
                    className={`${input} min-h-24`}
                    required={field.required}
                    value={values[field.name]}
                    onChange={(e) =>
                      setValues({ ...values, [field.name]: e.target.value })
                    }
                  />
                ) : (
                  <input
                    className={input}
                    type={field.type === "list" ? "text" : field.type || "text"}
                    min={field.min}
                    max={field.max}
                    required={field.required}
                    value={values[field.name]}
                    autoComplete={
                      field.type === "password" ? "new-password" : "off"
                    }
                    onChange={(e) =>
                      setValues({ ...values, [field.name]: e.target.value })
                    }
                  />
                )}
                {field.hint && (
                  <span className="block text-xs leading-5 text-neutral-500">
                    {field.hint}
                  </span>
                )}
              </label>
            ))}
            {error != null && <Notice error={error} />}
            <div className="flex justify-end gap-2 border-t border-white/10 pt-4">
              <button
                type="button"
                disabled={write.isPending}
                className={button}
                onClick={onClose}
              >
                Cancel
              </button>
              <button disabled={write.isPending} className={primary}>
                {write.isPending && (
                  <LoaderCircle className="h-4 w-4 animate-spin" />
                )}
                {method === "delete" ? "Confirm deletion" : "Save changes"}
              </button>
            </div>
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
          <div className="overflow-x-auto">
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
                    <th scope="col" className="px-5 py-4">
                      Actions
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[.05]">
                {query.data.data.map((row) => (
                  <tr key={row.id} className="transition hover:bg-white/[.02]">
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
                      <td className="px-5 py-3">
                        <div className="flex flex-wrap gap-2">
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
  canEdit?: boolean;
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
                  {canEdit && (
                    <button className={button} onClick={() => setEdit(row)}>
                      Edit
                    </button>
                  )}
                  {(typeof canDelete === "function"
                    ? canDelete(row)
                    : canDelete) && (
                    <button className={button} onClick={() => setRemove(row)}>
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
          path={edit === "new" ? endpoint : `${endpoint}${edit.id}/`}
          method={edit === "new" ? "post" : "patch"}
          fields={fields}
          initial={edit === "new" ? defaults : edit}
          onClose={() => setEdit(null)}
        />
      )}
      {remove && (
        <Editor
          title={`Delete ${String(remove.full_name || remove.name || remove.student_number || "record")}?`}
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
