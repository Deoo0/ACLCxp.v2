import AuthenticatedLayout from "../../components/layouts/UserLayout";

type Status = "participated" | "attended" | "absent";

interface EventRecord {
  id: number;
  name: string;
  date: string;
  status: Status;
  xp: number;
}

const statusConfig: Record<Status, { label: string; className: string }> = {
  participated: { label: "Joined", className: "bg-indigo-50 text-indigo-900" },
  attended: { label: "Attended", className: "bg-green-50 text-green-900" },
  absent: { label: "Absent", className: "bg-red-50 text-red-900" },
};

const records: EventRecord[] = [
  { id: 1, name: "Quiz Bowl", date: "May 22, 2026", status: "participated", xp: 120 },
  { id: 2, name: "Photography Contest", date: "May 18, 2026", status: "participated", xp: 100 },
  { id: 3, name: "Leadership Summit", date: "May 10, 2026", status: "attended", xp: 50 },
  { id: 4, name: "IT Symposium", date: "May 5, 2026", status: "attended", xp: 50 },
  { id: 5, name: "Sports Fest Opening", date: "Apr 28, 2026", status: "absent", xp: 0 },
  { id: 6, name: "Math Olympiad", date: "Apr 20, 2026", status: "participated", xp: 150 },
  { id: 7, name: "Campus Cleanup", date: "Apr 14, 2026", status: "attended", xp: 50 },
];

export default function MeritSheetPage() {
  const totalXP = records.reduce((sum, r) => sum + r.xp, 0);
  const participated = records.filter((r) => r.status === "participated").length;
  const attended = records.filter((r) => r.status === "attended").length;
  const totalJoined = records.filter((r) => r.status !== "absent").length;

  return (
    <>
      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        {[
          { label: "Total XP", value: totalXP.toLocaleString(), sub: "across all events" },
          { label: "Events joined", value: totalJoined, sub: `of ${records.length} total` },
          { label: "Participated", value: participated, sub: "active role" },
          { label: "Attended only", value: attended, sub: "as audience" },
        ].map((s) => (
          <div key={s.label} className="bg-white border border-gray-100 rounded-xl p-3">
            <p className="text-xs text-gray-400 mb-1">{s.label}</p>
            <p className="text-2xl font-semibold text-gray-900">{s.value}</p>
            <p className="text-xs text-gray-400 mt-0.5">{s.sub}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      <h2 className="text-sm font-semibold text-gray-900 mb-3">
        Event records
      </h2>

      <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">

        {/* Header */}
        <div className="grid grid-cols-[1fr_72px_56px] px-4 py-2 bg-gray-50 border-b border-gray-100">
          {["Event", "Status", "XP"].map((h) => (
            <span
              key={h}
              className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide text-center first:text-left"
            >
              {h}
            </span>
          ))}
        </div>

        {/* Rows */}
        {records.map((r, i) => {
          const cfg = statusConfig[r.status];

          return (
            <div
              key={r.id}
              className={`grid grid-cols-[1fr_72px_56px] px-4 py-3 items-center ${
                i < records.length - 1 ? "border-b border-gray-50" : ""
              }`}
            >
              <div>
                <p className="text-xs font-semibold text-gray-900 truncate">
                  {r.name}
                </p>
                <p className="text-[11px] text-gray-400 mt-0.5">
                  {r.date}
                </p>
              </div>

              <div className="flex justify-center">
                <span
                  className={`text-[10px] font-medium px-2 py-1 rounded-full ${cfg.className}`}
                >
                  {cfg.label}
                </span>
              </div>

              <div className="text-center text-sm font-semibold text-gray-900">
                {r.xp > 0 ? `+${r.xp}` : <span className="text-gray-300">—</span>}
              </div>
            </div>
          );
        })}

        {/* Total */}
        <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-t border-gray-200">
          <span className="text-xs font-medium text-gray-500">
            Total XP earned
          </span>
          <span className="text-sm font-semibold text-[#2E308E]">
            {totalXP.toLocaleString()} xp
          </span>
        </div>
      </div>
    </>
  );
}