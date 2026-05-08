export default function OngoingEvents() {
    return (
        <section className="px-6 py-12 sm:py-16 bg-white">
        <div className="max-w-6xl mx-auto">
            {/* Section Title */}
            <div className="mb-4 text-center">
                    <h2 className="text-4xl font-extrabold mb-2 text-[#D91B22]">ONGOING EVENT/S</h2>
            </div>

            {/* Placeholder Content */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
                <div
                    key={i}
                    className="bg-[#EAEAEA] drop-shadow-lg border-white/10 p-4"
                >
                    <div className="h-40 rounded-lg mb-4 flex items-center justify-center bg-gray-300 text-gray-500">
                        Image Placeholder   
                        {/* <img src="" alt="" /> */}
                    </div>

                    <h3 className="text-lg text-black font-semibold mb-2">Event Title {i}</h3>

                    <p className="text-slate-400 text-sm mb-4">Event description goes here</p>

                    <button className="w-full px-4 py-2 bg-white border border-[#B0B0B0] text-black rounded-lg text-sm font-medium shadow-sm hover:bg-gray-100 transition-all duration-200">
                    View Details
                    </button>
                </div>
            ))}
            </div>

            {/* Construction Note */}
            <div className="mt-8 p-4 bg-[#EAEAEA] border border-[#B0B0B0] rounded-lg text-[#B0B0B0] text-sm">
            <strong>To be constructed:</strong> Connect to backend API to fetch ongoing events, add event cards with images, attendance status, and participation buttons.
            </div>
        </div>
        </section>
    )
}
