const entries = [
  { rank: 1, name: "Maria Abadilla", initials: "MA", xp: 1580, avatarBg: "bg-amber-50",   avatarText: "text-amber-900" },
  { rank: 2, name: "Rico Santos",    initials: "RS", xp: 1490, avatarBg: "bg-gray-100",   avatarText: "text-gray-700" },
  { rank: 3, name: "Anna Lim",       initials: "AL", xp: 1340, avatarBg: "bg-orange-50",  avatarText: "text-orange-900" },
  { rank: 4, name: "You",            initials: "JD", xp: 1240, avatarBg: "bg-indigo-50",  avatarText: "text-indigo-900", isMe: true },
  { rank: 5, name: "Bea Cruz",       initials: "BC", xp: 1110, avatarBg: "bg-emerald-50", avatarText: "text-emerald-900" },
];

const rankColor = (r: number) =>
  r === 1 ? "text-amber-600" : r === 2 ? "text-gray-400" : r === 3 ? "text-orange-700" : "text-gray-400";

export default function Leaderboard() {
  return (
    <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
      {entries.map((e, i) => (
        <div
          key={e.rank}
          className={`flex items-center gap-3 px-4 py-2.5 ${i < entries.length - 1 ? "border-b border-gray-50" : ""} ${e.isMe ? "bg-indigo-50/60" : ""}`}
        >
          <span className={`w-5 text-center text-sm font-semibold ${e.isMe ? "text-[#2E308E]" : rankColor(e.rank)}`}>
            {e.rank <= 3 ? "●" : e.rank}
          </span>
          <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold ${e.avatarBg} ${e.avatarText}`}>
            {e.initials}
          </div>
          <span className={`flex-1 text-sm ${e.isMe ? "font-semibold text-[#2E308E]" : "text-gray-800"}`}>
            {e.name}
          </span>
          <span className={`text-sm font-semibold ${e.isMe ? "text-[#2E308E]" : "text-gray-800"}`}>
            {e.xp.toLocaleString()}
            <span className="text-xs font-normal text-gray-400 ml-0.5">xp</span>
          </span>
        </div>
      ))}
    </div>
  );
}