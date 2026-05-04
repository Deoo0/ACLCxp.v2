export default function Header() {
  return (
    <header className="sticky top-0 z-50 bg-slate-900/95 backdrop-blur-sm border-b border-white/10 px-6 py-4">
      <div className="flex items-center justify-between max-w-6xl mx-auto">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-lg bg-linear-to-br from-indigo-500 to-purple-600 flex items-center justify-center font-bold text-lg">
            A
          </div>
          <span className="font-bold text-xl tracking-wide hidden sm:inline">ACLCxp</span>
        </div>

        {/* Login Button */}
        <button className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-lg font-medium text-sm transition-colors duration-200">
          Login
        </button>
      </div>
    </header>
  )
}
