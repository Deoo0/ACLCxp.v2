import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { FaArrowLeft, FaEye, FaEyeSlash, FaLock, FaUser } from "react-icons/fa";
import { useAuth } from "../../context/AuthContext";
import ForgotPasswordModal from "../../components/ui/ForgotPasswordModal";
import SupportChat from "../../components/ui/SupportChat";
import LoadingScreen from "../../components/feedback/LoadingScreen";

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [studentId, setStudentId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showTransition, setShowTransition] = useState(false);
  const [loginComplete, setLoginComplete] = useState(false);
  const [redirectTo, setRedirectTo] = useState<string | null>(null);

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!studentId.trim() || !password) { setError("Enter your Student Number and password."); return; }
    try {
      setError(""); setLoading(true); setShowTransition(true); setLoginComplete(false);
      const user = await login({ student_id: studentId, password });
      setRedirectTo(user.role === "ADMIN" ? "/admin" : ["STAFF", "ORGANIZER"].includes(user.role) ? "/staff/attendance" : "/dashboard");
      setLoginComplete(true);
    } catch (err: any) {
      setShowTransition(false);
      const status = err?.response?.status;
      setError(status === 401 ? "Incorrect Student Number or password." : status === 403 ? "This account has been disabled. Please contact the SSC." : status === 404 ? "No activated account was found for this Student Number." : "Unable to sign in. Please try again.");
    } finally { setLoading(false); }
  };

  if (showTransition) return <LoadingScreen ready={loginComplete} onComplete={() => redirectTo && navigate(redirectTo, { replace: true })} />;

  return <><SupportChat /><section className="relative isolate min-h-screen overflow-hidden bg-neutral-950 px-4 py-5 text-neutral-200 sm:px-6 sm:py-8">
    <img src="/aclcxp-bg.png" alt="" className="absolute inset-0 h-full w-full object-cover opacity-25" />
    <div className="absolute inset-0 bg-neutral-950/75" />
    <div className="absolute inset-x-0 top-0 h-px bg-white/10" />
    <div className="relative z-10 mx-auto flex min-h-[calc(100vh-2.5rem)] max-w-6xl flex-col">
      <header className="flex items-center justify-between"><button onClick={() => navigate("/")} className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-neutral-400 transition hover:bg-white/[0.05] hover:text-neutral-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-400"><FaArrowLeft className="text-xs" /> Back to home</button><img src="/aclcxp-logo.png" alt="ACLCxp" className="h-10 w-10 object-contain" /></header>
      <main className="flex flex-1 items-center justify-center py-10"><div className="grid w-full max-w-4xl overflow-hidden rounded-2xl border border-white/10 bg-neutral-900/60 shadow-2xl shadow-black/30 md:grid-cols-[.82fr_1.18fr]">
        <aside className="hidden border-r border-white/10 bg-neutral-950/40 p-10 md:block"><img src="/aclcxp-logo.png" alt="ACLCxp" className="h-16 w-16 object-contain" /><div className="mt-12"><p className="text-xs font-semibold uppercase tracking-[.16em] text-amber-400">ACLCxp Student Portal</p><h1 className="mt-3 text-3xl font-semibold tracking-tight text-neutral-50">Student sign in</h1><p className="mt-4 text-sm leading-6 text-neutral-400">Access your attendance, events, points, and house information using your activated student account.</p></div><div className="mt-12 border-t border-white/10 pt-5 text-xs leading-5 text-neutral-500">First time here? Activate your account with your official Intramurals ticket.</div></aside>
        <div className="auth-panel-enter px-6 py-9 sm:px-12 sm:py-12"><div className="mx-auto max-w-sm"><div className="md:hidden"><p className="text-xs font-semibold uppercase tracking-[.16em] text-amber-400">ACLCxp Student Portal</p><h1 className="mt-2 text-2xl font-semibold text-neutral-50">Sign in</h1></div><div className="hidden md:block"><h2 className="text-2xl font-semibold text-neutral-50">Welcome back</h2><p className="mt-2 text-sm text-neutral-500">Enter your account details to continue.</p></div>
          {error && <div role="alert" className="mt-6 rounded-xl border border-red-400/20 bg-red-400/10 px-3 py-3 text-sm text-red-200">{error}</div>}
          <form onSubmit={handleLogin} className="mt-7 space-y-5"><div><label htmlFor="student-number" className="mb-2 block text-sm font-medium text-neutral-300">Student Number</label><div className="relative"><FaUser className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" /><input id="student-number" type="text" autoComplete="username" value={studentId} onChange={(e) => setStudentId(e.target.value.replace(/[^a-zA-Z0-9-]/g, "").toUpperCase())} placeholder="e.g. 2026-12345" maxLength={20} className="w-full rounded-xl border border-white/10 bg-neutral-950/50 py-2.5 pl-10 pr-3 text-neutral-100 placeholder:text-neutral-600 outline-none transition focus:border-amber-400/70 focus:ring-2 focus:ring-amber-400/15" /></div></div>
            <div><div className="mb-2 flex items-center justify-between"><label htmlFor="password" className="text-sm font-medium text-neutral-300">Password</label><button type="button" onClick={() => setShowForgotModal(true)} className="text-xs font-medium text-amber-400 hover:text-amber-300">Forgot password?</button></div><div className="relative"><FaLock className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" /><input id="password" type={showPassword ? "text" : "password"} autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter your password" maxLength={128} className="w-full rounded-xl border border-white/10 bg-neutral-950/50 py-2.5 pl-10 pr-11 text-neutral-100 placeholder:text-neutral-600 outline-none transition focus:border-amber-400/70 focus:ring-2 focus:ring-amber-400/15" /><button type="button" onClick={() => setShowPassword((visible) => !visible)} aria-label={showPassword ? "Hide password" : "Show password"} className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-2 text-neutral-500 transition hover:bg-white/[0.05] hover:text-neutral-300">{showPassword ? <FaEyeSlash /> : <FaEye />}</button></div></div>
            <button disabled={loading} className="min-h-11 w-full rounded-xl bg-amber-400 px-4 py-2.5 text-sm font-semibold text-neutral-950 shadow-sm transition hover:bg-amber-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-400 disabled:cursor-not-allowed disabled:opacity-60">{loading ? "Signing in…" : "Sign in"}</button>
          </form><p className="mt-7 border-t border-white/10 pt-5 text-center text-sm text-neutral-500">Need an account? <Link to="/register" className="font-semibold text-amber-400 hover:text-amber-300">Activate your account</Link></p></div></div>
      </div></main>
      <footer className="pb-2 text-center text-xs text-neutral-600">© 2026 ACLCxp · Student Portal</footer>
    </div>
  </section><ForgotPasswordModal isOpen={showForgotModal} onClose={() => setShowForgotModal(false)} /></>;
}
