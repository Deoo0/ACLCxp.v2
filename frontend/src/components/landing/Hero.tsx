import { Link } from "react-router-dom";
import { ArrowDown, ArrowRight, ShieldCheck } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

const houses = [
  ["azl", "Azul"], ["gia", "Giallio"], ["vrd", "Vierrdy"], ["chl", "Cahel"], ["rxo", "Roxxo"],
] as const;

export default function Hero() {
  const { user } = useAuth();
  const destination = user?.role === "ADMIN" ? "/admin" : user?.role === "STUDENT" ? "/dashboard" : "/register";

  return <section className="relative min-h-[100svh] overflow-hidden bg-neutral-950 text-white">
    {/* Mobile focuses the pillars and student; desktop keeps the full right-hand illustration. */}
    <img src="/aclcxp-bg.png" alt="ACLCxp Intramurals houses" className="absolute inset-0 h-full w-full object-cover object-[78%_center] sm:object-[72%_center] lg:object-right" />
    <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/55 to-black/75 sm:bg-gradient-to-r sm:from-black/90 sm:via-black/68 sm:to-black/15" />
    <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-neutral-950/80 to-transparent" />
    <div className="relative z-10 mx-auto flex min-h-[100svh] max-w-7xl flex-col px-5 pb-8 pt-20 sm:px-8 sm:pb-10 sm:pt-32 lg:px-12">
      <div className="mt-6 max-w-xl rounded-2xl border border-white/10 bg-black/15 p-5 backdrop-blur-[2px] sm:my-auto sm:border-0 sm:bg-transparent sm:p-0 sm:backdrop-blur-none">
        <div className="flex gap-2" aria-label="ACLC houses">{houses.map(([house, name]) => <img key={house} src={`/house-logos/${house}-logo.png`} alt={`${name} house`} className="h-8 w-8 object-contain sm:h-10 sm:w-10" />)}</div>
        <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-amber-300/30 bg-amber-300/10 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-amber-200"><ShieldCheck className="h-3.5 w-3.5" /> Official student portal</div>
        <h1 className="mt-5 font-xirod text-[clamp(3.2rem,14vw,6.5rem)] leading-[.88] tracking-tight">ACLC<span className="ml-1 align-super font-arcade text-[.5em] text-[#ef3b42]">XP</span></h1>
        <p className="mt-4 font-arcade text-sm tracking-[0.15em] text-amber-200 sm:text-lg">LEVEL UP THROUGH FUN</p>
        <p className="mt-5 max-w-lg text-sm leading-6 text-white/80 sm:text-base sm:leading-7">Your home for Intramurals events, attendance, house points, and student achievements.</p>
        <div className="mt-7 grid gap-3 sm:flex sm:flex-wrap"><Link to={destination} className="group inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-amber-400 px-5 py-3 text-sm font-semibold text-neutral-950 shadow-lg shadow-black/25 transition hover:-translate-y-0.5 hover:bg-amber-300 active:scale-[0.98]">{user ? "Open dashboard" : "Activate your account"}<ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" /></Link>{!user && <Link to="/login" className="inline-flex min-h-12 items-center justify-center rounded-xl border border-white/25 bg-white/10 px-5 py-3 text-sm font-semibold text-white backdrop-blur-sm transition hover:bg-white/20 active:scale-[0.98]">Student login</Link>}</div>
      </div>
      <a href="#events" className="mt-8 hidden w-fit items-center gap-2 text-xs font-medium text-white/60 transition hover:text-white sm:inline-flex">Explore events <ArrowDown className="h-4 w-4" /></a>
    </div>
  </section>;
}
