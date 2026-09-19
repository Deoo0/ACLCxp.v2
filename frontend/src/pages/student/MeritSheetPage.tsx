import { StudentFrame } from "../../components/dashboard/LivePortal";
import { Records } from "../../components/admin/ConsoleUI";
export default function MeritSheetPage() {
  return (
    <StudentFrame>
      <header>
        <p className="text-sm text-amber-300">Your participation, recorded</p>
        <h1 className="mt-2 text-3xl font-semibold text-white">Merit sheet</h1>
        <p className="mt-2 text-sm text-neutral-400">
          Your effective points and attendance, updated from verified school
          records.
        </p>
      </header>
      <section>
        <h2 className="mb-4 font-semibold text-white">Points history</h2>
        <Records
          endpoint="/portal/merit/"
          columns={[
            {
              key: "created_at",
              label: "Date",
              render: (r) =>
                new Date(String(r.created_at)).toLocaleDateString(),
            },
            { key: "event_title", label: "Event" },
            { key: "transaction_type", label: "Type" },
            { key: "reason", label: "Reason" },
            { key: "points", label: "Points" },
          ]}
        />
      </section>
      <section>
        <h2 className="mb-4 font-semibold text-white">Attendance history</h2>
        <Records
          endpoint="/portal/attendance/"
          columns={[
            { key: "event_title", label: "Event" },
            {
              key: "scanned_at",
              label: "Check-in",
              render: (r) => new Date(String(r.scanned_at)).toLocaleString(),
            },
            { key: "is_valid", label: "Valid" },
            { key: "validation_notes", label: "Correction notes" },
          ]}
        />
      </section>
    </StudentFrame>
  );
}
