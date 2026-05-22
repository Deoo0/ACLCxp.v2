type Status = "live" | "closing" | "open";

interface Event {
  id: number;
  title: string;
  location: string;
  time: string;
  month: string;
  day: number;
  status: Status;
}

const statusConfig: Record<Status, { label: string; className: string }> = {
  live:    { label: "Live now",     className: "bg-red-50 text-red-700" },
  closing: { label: "Closing soon", className: "bg-indigo-50 text-indigo-700" },
  open:    { label: "Open",         className: "bg-green-50 text-green-700" },
};

// Replace with API fetch
const events: Event[] = [
  { id: 1, title: "Inter-College Quiz Bowl", location: "Room 301", time: "9:00 AM", month: "May", day: 22, status: "live" },
  { id: 2, title: "Photography Contest",     location: "Online",   time: "Deadline 11:59 PM", month: "May", day: 24, status: "closing" },
  { id: 3, title: "Tech Hackathon 2026",     location: "Lab 2",    time: "8:00 AM", month: "May", day: 30, status: "open" },
];

export default function EventList() {
  return (
    <div className="flex flex-col gap-3">
      {events.map((e) => {
        const cfg = statusConfig[e.status];
        return (
          <div key={e.id} className="bg-white border border-gray-100 rounded-xl p-3 flex gap-3 items-start">

            {/* Date box */}
            <div className="flex-shrink-0 w-10 bg-indigo-50 rounded-lg text-center py-1.5">
              <p className="text-[9px] font-semibold text-indigo-600 uppercase tracking-wide">{e.month}</p>
              <p className="text-lg font-semibold text-indigo-900 leading-tight">{e.day}</p>
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate">{e.title}</p>
              <p className="text-xs text-gray-400 mt-0.5">{e.location} · {e.time}</p>
              <span className={`inline-block mt-1.5 text-[10px] font-medium px-2 py-0.5 rounded-full ${cfg.className}`}>
                {cfg.label}
              </span>
            </div>

            <button className="flex-shrink-0 mt-0.5 text-xs font-semibold text-[#2E308E] bg-white border border-indigo-100 rounded-lg px-3 py-1.5 hover:bg-indigo-50 transition-colors">
              Join
            </button>
          </div>
        );
      })}
    </div>
  );
}