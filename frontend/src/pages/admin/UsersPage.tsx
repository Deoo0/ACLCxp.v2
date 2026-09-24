import { useState } from "react";
import { Upload, Download, Ticket } from "lucide-react";
import {
  ResourcePage,
  Editor,
  button,
  primary,
  danger,
  positive,
  secondary,
  input,
  Notice,
  Panel,
  Badge,
} from "../../components/admin/ConsoleUI";
import type { Field } from "../../components/admin/ConsoleUI";
import { useApi, useWrite } from "../../services/queries";
import { AccountFilters } from "../../components/admin/Filters";
import type { Filters, AccountOptions } from "../../components/admin/Filters";
import type { Row } from "../../services/queries";
import api from "../../services/api";
import { downloadBlob, downloadCsv } from "../../services/download";

const rosterFields: Field[] = [
  { name: "student_number", label: "Student number", required: true },
  { name: "first_name", label: "First name", required: true },
  { name: "middle_name", label: "Middle name" },
  { name: "last_name", label: "Last name", required: true },
  { name: "program", label: "Program code", required: true },
  {
    name: "year_level",
    label: "Year level",
    type: "number",
    min: 1,
    required: true,
  },
  { name: "section", label: "Section" },
  { name: "is_eligible", label: "Eligible to activate", type: "checkbox" },
];
const userFields: Field[] = [
  { name: "first_name", label: "First name", required: true },
  { name: "last_name", label: "Last name", required: true },
  { name: "email", label: "Email", type: "email", required: true },
  { name: "program", label: "Program", required: true },
  {
    name: "year_level",
    label: "Year level",
    type: "number",
    min: 1,
    required: true,
  },
  {
    name: "house_id",
    label: "House",
    type: "lookup",
    endpoint: "/admin/houses/",
  },
  {
    name: "role",
    label: "Access role",
    type: "select",
    required: true,
    options: ["STUDENT", "STAFF", "ORGANIZER", "ADMIN"].map((value) => ({
      label: value,
      value,
    })),
  },
  { name: "is_active", label: "Account enabled", type: "checkbox" },
  {
    name: "password",
    label: "Reset password",
    type: "password",
    hint: "Leave blank to keep the current password. Share a changed password securely.",
  },
];
export default function UsersPage() {
  const [filters, setFilters] = useState<Filters>({});
  const options = useApi<AccountOptions>("/admin/users/filter-options/");
  const [tab, setTab] = useState("users");
  const [edit, setEdit] = useState<Row | null>(null);
  const [toggle, setToggle] = useState<Row | null>(null);
  const [selected, setSelected] = useState<number[]>([]);
  const [deleteBatch, setDeleteBatch] = useState(false);
  const [count, setCount] = useState(10);
  const [downloadingTickets, setDownloadingTickets] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState<unknown>(null);
  const write = useWrite();
  const importCsv = async (file: File) => {
    setError(null);
    try {
      if (file.size > 5_000_000)
        throw new Error("CSV files must be smaller than 5 MB.");
      const data = await write.mutateAsync({
        path: "/admin/roster/bulk/",
        body: { csv: await file.text() },
      });
      setMessage(`${data.created} roster records imported.`);
    } catch (e) {
      setError(e);
    }
  };
  const template = async () => {
    setError(null);
    try {
      const response = await api.get("/admin/tickets/template/", { responseType: "blob" });
      downloadBlob(response.data, "activation-tickets-template.xlsx");
    } catch (e) { setError(e); }
  };
  const redownloadTickets = async () => {
    setError(null);
    setMessage("");
    setDownloadingTickets(true);
    try {
      const response = await api.get("/admin/tickets/export/", { responseType: "blob" });
      downloadBlob(response.data, "available-activation-tickets.csv");
      setMessage("Available tickets downloaded with their original QR tokens. Keep the file secure.");
    } catch (e) {
      // Blob requests also return API validation errors as blobs.
      if (e && typeof e === "object" && "response" in e) {
        const response = (e as { response?: { data?: unknown } }).response;
        if (response?.data instanceof Blob) {
          try { response.data = JSON.parse(await response.data.text()); } catch { /* Use the original error. */ }
        }
      }
      setError(e);
    } finally {
      setDownloadingTickets(false);
    }
  };
  const importTickets = async (file: File) => {
    setError(null);
    setMessage("");
    try {
      if (file.size > 5_000_000) throw new Error("Excel files must be smaller than 5 MB.");
      const body = new FormData();
      body.append("file", file);
      const rows: Row[] = await write.mutateAsync({ path: "/admin/tickets/import/", body });
      downloadCsv([["Ticket number", "QR token"], ...rows.map(row => [row.ticket_number, row.qr_token])], "imported-activation-tickets.csv");
      setMessage(`${rows.length} tickets imported. Ticket numbers and generated QR tokens downloaded.`);
      setSelected([]);
    } catch (e) { setError(e); }
  };
  const generate = async () => {
    setError(null);
    try {
      const rows: Row[] = await write.mutateAsync({
        path: "/admin/tickets/generate/",
        body: { count },
      });
      downloadCsv(
        [
          ["Ticket number", "QR token"],
          ...rows.map((r) => [r.ticket_number, r.qr_token]),
        ],
        "activation-tickets.csv",
      );
      setMessage(
        `${rows.length} tickets created and downloaded. Keep the file secure.`,
      );
    } catch (e) {
      setError(e);
    }
  };
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        {[
          ["users", "Accounts"],
          ["roster", "Student roster"],
          ["tickets", "Activation tickets"],
        ].map(([key, label]) => (
          <button
            key={key}
            onClick={() => {
              setTab(key);
              setMessage("");
              setError(null);
            }}
            className={tab === key ? primary : button}
          >
            {label}
          </button>
        ))}
      </div>
      {error != null && <Notice error={error} />}
      {message && (
        <p
          role="status"
          className="rounded-xl bg-emerald-400/10 p-4 text-sm text-emerald-200"
        >
          {message}
        </p>
      )}
      {tab === "users" && (
        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {options.data?.roles.map((role) => (
              <button
                key={role.value}
                aria-pressed={filters.role === role.value}
                className={`rounded-2xl border p-4 text-left transition ${filters.role === role.value ? "border-amber-400/40 bg-amber-400/10" : "border-white/10 bg-neutral-900/60 hover:border-white/25"}`}
                onClick={() =>
                  setFilters({
                    ...filters,
                    role: filters.role === role.value ? "" : role.value,
                  })
                }
              >
                <span className="block text-xs text-neutral-400">
                  {role.label}
                </span>
                <span className="mt-2 block text-2xl font-semibold text-white">
                  {role.count}
                </span>
              </button>
            ))}
          </div>
          <Panel>
            <AccountFilters values={filters} onChange={setFilters} />
          </Panel>
          <ResourcePage
            title="Students & access"
            description="Manage verified accounts, house assignments and administrative access. Students activate through the school roster."
            endpoint="/admin/users/"
            listEndpoint={`/admin/users/?${new URLSearchParams(filters)}`}
            canDelete={(row) => row.role === "STUDENT"}
            deleteDescription="Permanently delete this student account and revoke access. Students with event, attendance, or points history must be disabled instead. Any linked roster identity is retained as ineligible, and redeemed tickets remain used."
            columns={[
              { key: "student_id", label: "Student number" },
              { key: "full_name", label: "Name" },
              { key: "program", label: "Program" },
              { key: "year_level", label: "Year level" },
              { key: "house_name", label: "House" },
              {
                key: "role",
                label: "Role",
                render: (r) => <Badge value={r.role} />,
              },
              { key: "is_active", label: "Enabled" },
            ]}
            extraActions={(r) => (
              <button className={button} onClick={() => setEdit(r)}>
                Manage account
              </button>
            )}
          />
        </div>
      )}
      {tab === "roster" && (
        <ResourcePage
          title="Student roster"
          description="School-controlled identities used during student activation. Activated records are protected from changes."
          endpoint="/admin/roster/"
          fields={rosterFields}
          defaults={{ is_eligible: true, year_level: 1 }}
          canCreate
          canEdit
          canDelete
          columns={[
            { key: "student_number", label: "Student number" },
            { key: "first_name", label: "First name" },
            { key: "last_name", label: "Last name" },
            { key: "program", label: "Program" },
            { key: "section", label: "Section" },
            { key: "account", label: "Account ID" },
          ]}
        >
          <Panel>
            <div className="flex flex-wrap gap-3">
              <button
                className={button}
                onClick={() =>
                  downloadCsv(
                    [
                      [
                        "student_number",
                        "first_name",
                        "middle_name",
                        "last_name",
                        "program",
                        "year_level",
                        "section",
                        "is_eligible",
                      ],
                      [
                        "2027-00001",
                        "Ada",
                        "",
                        "Santos",
                        "BSIT",
                        1,
                        "A",
                        "true",
                      ],
                    ],
                    "roster-template.csv",
                  )
                }
              >
                <Download className="h-4 w-4" />
                CSV template
              </button>
              <label className={button}>
                <Upload className="h-4 w-4" />
                {write.isPending ? "Importing..." : "Import CSV"}
                <input
                  className="sr-only"
                  type="file"
                  accept=".csv,text/csv"
                  disabled={write.isPending}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) void importCsv(file);
                    e.target.value = "";
                  }}
                />
              </label>
            </div>
            <p className="mt-3 text-xs text-neutral-500">
              Up to 5,000 rows. The entire import is rejected if a row is
              invalid or a student number already exists.
            </p>
          </Panel>
        </ResourcePage>
      )}
      {tab === "tickets" && (
        <ResourcePage
          title="Activation tickets"
          description="Issue unique tickets for roster-verified activation. Each ticket can activate one student account."
          endpoint="/admin/tickets/"
          canDelete={row => row.status !== "REDEEMED"}
          deleteDescription="Permanently delete this unused ticket. It will no longer activate an account. Redeemed tickets are retained as activation history."
          columns={[
            { key: "selected", label: "Select", render: row => <input type="checkbox" className="h-5 w-5 accent-amber-400" aria-label={`Select ticket ${row.ticket_number}`} disabled={row.status === "REDEEMED"} checked={selected.includes(row.id)} onChange={e => setSelected(ids => e.target.checked ? [...ids, row.id] : ids.filter(id => id !== row.id))} /> },
            { key: "ticket_number", label: "Ticket number" },
            {
              key: "status",
              label: "Status",
              render: (r) => <Badge value={r.status} />,
            },
            { key: "issued_at", label: "Issued" },
            { key: "redeemed_at", label: "Redeemed" },
          ]}
          extraActions={(r) =>
            r.status !== "REDEEMED" && (
              <button className={r.status === "DISABLED" ? positive : danger} onClick={() => setToggle(r)}>
                {r.status === "DISABLED" ? "Enable" : "Disable"}
              </button>
            )
          }
        >
          <Panel>
            <div className="mb-5 flex flex-wrap items-center gap-3 border-b border-white/10 pb-5">
              <button className={secondary} onClick={() => void template()}><Download className="h-4 w-4" />Excel template</button>
              <button className={secondary} disabled={downloadingTickets || write.isPending} onClick={() => void redownloadTickets()}>
                <Download className="h-4 w-4" />{downloadingTickets ? "Downloading…" : "Re-download available tickets"}
              </button>
              <p className="w-full text-xs leading-5 text-neutral-400">Download all available tickets in the current season with their original QR tokens. Redeemed and disabled tickets are excluded. Tokens can redeem tickets; share each one only with its intended student.</p>
              <label className={`${positive} relative cursor-pointer focus-within:ring-2 focus-within:ring-emerald-300`}>
                <Upload className="h-4 w-4" />{write.isPending ? "Importing…" : "Import Excel"}
                <input className="absolute inset-0 w-full cursor-pointer opacity-0" aria-label="Import activation tickets from Excel" type="file" accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" disabled={write.isPending} onChange={e => { const file = e.target.files?.[0]; if (file) void importTickets(file); e.target.value = ""; }} />
              </label>
              <button className={danger} disabled={!selected.length || selected.length > 500 || write.isPending} onClick={() => setDeleteBatch(true)}>Delete selected ({selected.length})</button>
              {selected.length > 0 && <button className={button} onClick={() => setSelected([])}>Clear selection</button>}
              <p className="w-full text-xs leading-5 text-neutral-400">Import up to 5,000 unique 6- or 12-digit ticket numbers using the template. Keep cells formatted as Text to preserve leading zeros. Select up to 500 unused tickets for deletion.</p>
            </div>
            <div className="flex flex-wrap items-end gap-3">
              <label className="space-y-2 text-sm text-neutral-400">
                <span>Number of tickets</span>
                <input
                  type="number"
                  min={1}
                  max={500}
                  className={`${input} max-w-40`}
                  value={count}
                  onChange={(e) => setCount(Number(e.target.value))}
                />
              </label>
              <button
                className={primary}
                disabled={write.isPending || count < 1 || count > 500}
                onClick={() => void generate()}
              >
                <Ticket className="h-4 w-4" />
                Generate & download
              </button>
            </div>
          </Panel>
        </ResourcePage>
      )}
      {edit && (
        <Editor
          title="Manage account"
          path={`/admin/users/${edit.id}/`}
          method="patch"
          fields={userFields}
          initial={{ ...edit, house_id: edit.house }}
          onClose={() => setEdit(null)}
        />
      )}
      {deleteBatch && <Editor destructive title={`Delete ${selected.length} selected tickets?`} description="Permanently delete the selected unused tickets. They will no longer activate accounts. If any selected ticket has since been redeemed, nothing will be deleted." path="/admin/tickets/batch-delete/" fields={[]} transform={() => ({ ids: selected })} onClose={() => { setDeleteBatch(false); setSelected([]); }} />}
      {toggle && (
        <Editor
          title={`${toggle.status === "DISABLED" ? "Enable" : "Disable"} ticket ${toggle.ticket_number}?`}
          description="This changes whether the ticket can be used to activate an account."
          path={`/admin/tickets/${toggle.id}/toggle/`}
          fields={[]}
          onClose={() => setToggle(null)}
        />
      )}
    </div>
  );
}
