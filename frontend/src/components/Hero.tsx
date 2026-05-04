export default function Hero() {
  return (
    <section className="px-6 py-12 sm:py-16 md:py-20 bg-linear-to-b from-slate-900 via-slate-950 to-slate-950">
      <div className="max-w-3xl mx-auto text-center">
        {/* Main Heading */}
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-4 bg-linear-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent leading-tight">
          Track Events, Celebrate Achievements
        </h1>

        {/* Subheading */}
        <p className="text-lg sm:text-xl text-slate-300 mb-8 leading-relaxed">
          Stay updated with school events, track your participation, and build your merit sheet in real-time.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button className="px-8 py-3 bg-indigo-600 hover:bg-indigo-700 rounded-lg font-semibold transition-colors duration-200">
            Get Started
          </button>
          <button className="px-8 py-3 border-2 border-indigo-500/50 hover:border-indigo-400 text-indigo-300 hover:text-indigo-200 rounded-lg font-semibold transition-colors duration-200">
            Learn More
          </button>
        </div>
      </div>

      {/* Decorative Elements */}
      <div className="mt-12 sm:mt-16 relative h-64 sm:h-80">
        <div className="absolute inset-0 bg-linear-to-t from-indigo-500/10 to-transparent rounded-2xl"></div>
        <div className="absolute top-0 left-1/4 w-72 h-72 bg-indigo-500/20 rounded-full blur-3xl opacity-50"></div>
        <div className="absolute bottom-0 right-1/4 w-72 h-72 bg-purple-500/20 rounded-full blur-3xl opacity-50"></div>
      </div>
    </section>
  )
}
