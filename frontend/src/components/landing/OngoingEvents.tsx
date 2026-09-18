type EventStatus = "live" | "closing" | "open";


// TODO: Move data fetching to LandingPage once API exists


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
    <section id="events" className="bg-gradient-to-b from-slate-950 to-slate-900 px-4 py-14 sm:py-20">
      <div className="max-w-6xl mx-auto">

        <div className="mb-6 text-center">
          <p className="mb-2 text-xs font-bold tracking-[0.22em] text-yellow-300">WHAT'S HAPPENING</p>
          <h2 className="text-3xl font-extrabold text-white uppercase tracking-wide sm:text-4xl">
            Ongoing Events
          </h2>
          <p className="mt-2 text-sm text-slate-400">Active events you can join right now</p>
        </div>

        <div className="mx-auto grid max-w-5xl gap-4 md:grid-cols-3">
          {events.map((event) => {
            const cfg = statusConfig[event.status];
            return (
              <div key={event.id} className="group flex min-h-44 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.06] shadow-lg transition duration-200 hover:-translate-y-1 hover:border-white/20 hover:bg-white/[0.09]">
                {/* Left accent bar */}
                <div className={`w-1 shrink-0 ${cfg.accent}`} />

                {/* Body */}
                <div className="flex-1 px-4 py-3">
                  <span className={`inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${cfg.bg} ${cfg.text} mb-1`}>
                    {cfg.label}
                  </span>
                  <p className="text-base font-bold text-white">{event.title}</p>
                  <p className="mt-1 text-xs text-slate-400">{event.date}</p>
                  <button className="mt-4 rounded-lg border border-yellow-300/30 bg-yellow-300/10 px-3 py-1.5 text-xs font-semibold text-yellow-200 transition-colors hover:bg-yellow-300 hover:text-slate-950">
                    View Details
                  </button>
                </div>

                {/* Icon placeholder — swap for <img> when API is ready */}
                <div className="mr-3 flex h-14 w-14 shrink-0 self-center items-center justify-center rounded-xl bg-white/10 text-2xl">
                  🏆
                </div>
              </div>
            );
          })}
        </div>


        {/* TODO: Replace static events with API data */}


      </div>
    </section>
  );
}
