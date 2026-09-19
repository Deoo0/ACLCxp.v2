import { useCallback, useState } from "react";
import { ScanLine, Download } from "lucide-react";
import {
  PageHeading,
  Panel,
  Records,
  Editor,
  button,
  primary,
  input,
  Notice,
  Badge,
} from "../../components/admin/ConsoleUI";
import QRScanner from "../../components/admin/QRScanner";
import { useApi, useWrite } from "../../services/queries";
import type { Row, PageData } from "../../services/queries";
import api from "../../services/api";
import { downloadBlob } from "../../services/download";
export default function AttendanceReportsPage() {
  const [event, setEvent] = useState("");
  const [search, setSearch] = useState("");
  const [student, setStudent] = useState("");
  const [scanner, setScanner] = useState(false);
  const [correction, setCorrection] = useState<Row | null>(null);
  const [error, setError] = useState<unknown>(null);
  const [message, setMessage] = useState("");
  const [exporting, setExporting] = useState(false);
  const events = useApi<PageData>(
    `/events/?page_size=100&search=${encodeURIComponent(search)}`,
  );
  const write = useWrite();
  const mutateAsync = write.mutateAsync;
  const submit = useCallback(
    async (token?: string) => {
      setScanner(false);
      setError(null);
      try {
        const row = await mutateAsync({
          path: "/admin/attendance/check_in/",
          body: {
            event: Number(event),
            ...(token ? { token } : { student_id: student }),
          },
        });
        setMessage(
          `Attendance recorded for ${row.student_name}. Participation points are synchronized.`,
        );
        setStudent("");
      } catch (e) {
        setError(e);
      }
    },
    [event, student, mutateAsync],
  );
  const scan = useCallback(
    (token: string) => {
      void submit(token);
    },
    [submit],
  );
  const exportRows = async () => {
    setExporting(true);
    setError(null);
    try {
      const response = await api.get(
        `/admin/attendance/export/${event ? `?event=${event}` : ""}`,
        { responseType: "blob", timeout: 120000 },
      );
      downloadBlob(response.data, "attendance.csv");
    } catch (e) {
      setError(e);
    } finally {
      setExporting(false);
    }
  };
  return (
    <div className="space-y-6">
      <PageHeading
        title="Attendance & reports"
        description="Record confirmed students at ongoing events. Scans award participation points once; corrections update the student merit record."
      />
      <Panel>
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="space-y-3">
            <label className="block space-y-2 text-sm text-neutral-400">
              <span>Find an event</span>
              <input
                className={input}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search event title"
              />
            </label>
            <select
              aria-label="Attendance event"
              className={input}
              value={event}
              onChange={(e) => {
                setEvent(e.target.value);
                setScanner(false);
              }}
            >
              <option value="">All events (reports only)</option>
              {events.data?.data.map((r) => (
                <option key={r.id} value={r.id}>
                  {String(r.title)} / {String(r.status)}
                </option>
              ))}
            </select>
            {events.isError && <Notice error={events.error} />}
            <button
              className={button}
              disabled={exporting}
              onClick={() => void exportRows()}
            >
              <Download className="h-4 w-4" />
              {exporting
                ? "Exporting..."
                : event
                  ? "Export selected event"
                  : "Export all attendance"}
            </button>
          </div>
          <form
            className="space-y-3"
            onSubmit={(e) => {
              e.preventDefault();
              void submit();
            }}
          >
            <label className="block space-y-2 text-sm text-neutral-400">
              <span>Manual check-in / student number</span>
              <input
                required
                className={input}
                value={student}
                onChange={(e) => setStudent(e.target.value)}
                placeholder="Enter the school student number"
              />
            </label>
            <div className="flex flex-wrap gap-2">
              <button className={primary} disabled={!event || write.isPending}>
                Record attendance
              </button>
              <button
                type="button"
                className={button}
                disabled={!event || write.isPending}
                onClick={() => setScanner(!scanner)}
              >
                <ScanLine className="h-4 w-4" />
                {scanner ? "Close camera" : "Scan QR pass"}
              </button>
            </div>
          </form>
        </div>
        {scanner && (
          <div className="mx-auto mt-5 max-w-sm">
            <QRScanner onScan={scan} />
          </div>
        )}
      </Panel>
      {error != null && <Notice error={error} />}
      {message && (
        <p
          role="status"
          className="rounded-xl bg-emerald-400/10 p-4 text-sm text-emerald-200"
        >
          {message}
        </p>
      )}
      <Records
        key={event}
        endpoint={`/admin/attendance/${event ? `?event=${event}` : ""}`}
        columns={[
          { key: "event_title", label: "Event" },
          { key: "student_id", label: "Student number" },
          { key: "student_name", label: "Student" },
          {
            key: "scanned_at",
            label: "Check-in",
            render: (r) => new Date(String(r.scanned_at)).toLocaleString(),
          },
          {
            key: "is_valid",
            label: "Status",
            render: (r) => <Badge value={r.is_valid ? "VALID" : "VOIDED"} />,
          },
        ]}
        actions={(r) => (
          <button className={button} onClick={() => setCorrection(r)}>
            {r.is_valid ? "Void" : "Restore"}
          </button>
        )}
      />
      {correction && (
        <Editor
          title={`${correction.is_valid ? "Void" : "Restore"} attendance`}
          description="This also reverses or restores the corresponding participation points. The action is recorded in the audit trail."
          fields={[
            {
              name: "reason",
              label: "Reason for correction",
              type: "textarea",
              required: true,
            },
          ]}
          path={`/admin/attendance/${correction.id}/correct/`}
          transform={(data) => ({ ...data, is_valid: !correction.is_valid })}
          onClose={() => setCorrection(null)}
        />
      )}
    </div>
  );
}
