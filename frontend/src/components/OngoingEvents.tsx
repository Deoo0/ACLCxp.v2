export default function OngoingEvents() {
    return (
        <section className="px-6 py-12 sm:py-16 bg-white">
        <div className="max-w-6xl mx-auto">
            {/* Section Title */}
            <div className="mb-8">
                    <h2 className="text-4xl font-extrabold mb-2 text-[#D91B22]">ONGOING EVENT/S</h2>
                    <p className="text-slate-400">Join and track your participation</p>
            </div>

            {/* Placeholder Content */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
                <div
                    key={i}
                    className="bg-slate-900/60 border border-white/10 rounded-xl p-6 hover:border-indigo-500/50 transition-all duration-200"
                >
                    <div className="h-40 bg-linear-to-br from-slate-800 to-slate-900 rounded-lg mb-4 flex items-center justify-center text-slate-500">
                        Event Image
                    </div>

                    <h3 className="text-lg font-semibold mb-2">Event Title {i}</h3>

                    <p className="text-slate-400 text-sm mb-4">Event description goes here</p>

                    <button className="w-full px-4 py-2 bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/30 text-indigo-300 rounded-lg text-sm font-medium transition-colors">
                        View Details
                    </button>
                </div>
            ))}
            </div>

            {/* Construction Note */}
            <div className="mt-8 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg text-blue-300 text-sm">
            📝 <strong>To be constructed:</strong> Connect to backend API to fetch ongoing events, add event cards with images, attendance status, and participation buttons.
            </div>
        </div>
        </section>
    )
}
