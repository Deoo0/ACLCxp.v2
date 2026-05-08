export default function CTA() {
  return (
    <section className="px-6 py-12 sm:py-16 bg-linear-to-b from-slate-950 to-slate-900">
      <div className="max-w-4xl mx-auto">
        <div className="bg-linear-to-r from-indigo-600/20 to-purple-600/20 border border-indigo-500/30 rounded-2xl p-8 sm:p-12 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">Don't Miss Any Event</h2>
          <p className="text-slate-300 mb-8 text-lg">
            Stay connected with your school community and maximize your achievements.
          </p>
          <button className="px-8 py-3 bg-indigo-600 hover:bg-indigo-700 rounded-lg font-semibold transition-colors duration-200">
            Sign Up Today
          </button>
        </div>

        {/* Construction Note */}
        <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg text-blue-300 text-sm">
          📝 <strong>To be constructed:</strong> Add email subscription form, newsletter signup, or app download links.
        </div>
      </div>
    </section>
  )
}
