type EventStatus = "live" | "closing" | "open";

const events = [
  { id: 1, title: "Inter-College Quiz Bowl", date: "May 22 · Rm 301", status: "live" as EventStatus },
  { id: 2, title: "Photography Contest", date: "May 24 · Online", status: "closing" as EventStatus },
  { id: 3, title: "Tech Hackathon 2026", date: "May 30 · Lab 2", status: "open" as EventStatus },
];

const statusConfig: Record<EventStatus, { label: string; bg: string; text: string; accent: string }> = {
  live:    { label: "Live",         bg: "bg-indigo-50",  text: "text-[#2E308E]", accent: "bg-[#2E308E]" },
  closing: { label: "Closing Soon", bg: "bg-red-50",     text: "text-[#D91B22]", accent: "bg-[#D91B22]" },
  open:    { label: "Open",         bg: "bg-emerald-50", text: "text-emerald-700", accent: "bg-emerald-600" },
};

export default function OngoingEvents() {
  return (
    <section className="px-4 py-10 bg-white">
      <div className="max-w-6xl mx-auto">

        <div className="mb-6 text-center">
          <h2 className="text-3xl font-extrabold text-[#D91B22] uppercase tracking-wide">
            Ongoing Events
          </h2>
          <p className="text-sm text-gray-400 mt-1">Active events you can join right now</p>
        </div>

        <div className="flex flex-col gap-3">
          {events.map((event) => {
            const cfg = statusConfig[event.status];
            return (
              <div key={event.id} className="flex bg-gray-50 border border-gray-100 rounded-xl overflow-hidden">
                {/* Left accent bar */}
                <div className={`w-1 shrink-0 ${cfg.accent}`} />

                {/* Body */}
                <div className="flex-1 px-4 py-3">
                  <span className={`inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${cfg.bg} ${cfg.text} mb-1`}>
                    {cfg.label}
                  </span>
                  <p className="text-sm font-bold text-gray-900">{event.title}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{event.date}</p>
                  <button className="mt-2 text-xs font-semibold text-[#2E308E] bg-white border border-indigo-100 rounded-md px-3 py-1 hover:bg-indigo-50 transition-colors">
                    View Details
                  </button>
                </div>

                {/* Icon placeholder — swap for <img> when API is ready */}
                <div className="w-16 h-16 self-center mr-3 rounded-lg bg-indigo-50 flex items-center justify-center shrink-0 text-indigo-300 text-2xl">
                  🏆
                </div>
              </div>
            );
          })}
        </div>

        {/* Dev note — remove before launch */}
        <p className="mt-6 text-[11px] text-gray-300 border border-dashed border-gray-200 rounded-lg p-3">
          <strong>TODO:</strong> Replace static array with API fetch. Map real event data to this layout.
        </p>
      </div>
    </section>
  );
}