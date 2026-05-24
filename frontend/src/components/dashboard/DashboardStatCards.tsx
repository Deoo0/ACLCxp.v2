const stats = [
  { label: "Attendance",   value: "18",   sub: "of 22 events", progress: 82,  color: "#2E308E" },
  { label: "XP Points",    value: "1,240", sub: "Rank #4 overall", progress: 62, color: "#B45309" },
  { label: "Participated", value: "14",   sub: "events joined" },
  { label: "Streak",       value: "7",    sub: "days in a row" },
];

export default function StatCards() {
  return (
    <div className="grid grid-cols-2 gap-3">
      {stats.map((s) => (
        <div key={s.label} className="bg-white border border-gray-100 rounded-xl p-3">
          <p className="text-xs text-gray-400 mb-1">{s.label}</p>
          <p className="text-2xl font-semibold text-gray-900">{s.value}</p>
          <p className="text-xs text-gray-400 mt-0.5">{s.sub}</p>
          {s.progress !== undefined && (
            <div className="mt-2 h-1 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full"
                style={{ width: `${s.progress}%`, background: s.color }}
              />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}