import { Link } from "react-router-dom";

export default function CTA() {
  return (
    <section className="bg-neutral-950 px-4 pb-8 pt-2 text-neutral-200 sm:px-6 sm:pb-10 lg:px-8">
      <div className="relative mx-auto flex min-h-[22rem] max-w-7xl flex-col items-center overflow-hidden rounded-2xl border border-white/10 bg-neutral-900/60 px-5 py-9 text-center sm:min-h-[25rem] sm:px-8">
        <div className="pointer-events-none absolute -left-20 bottom-0 h-56 w-56 rounded-full bg-amber-400/10 blur-3xl" />

        {/* Heading */}
        <p className="relative mb-3 text-xs font-bold tracking-[0.22em] text-amber-400">READY WHEN YOU ARE</p>
        <h2 className="relative text-3xl font-semibold leading-tight text-neutral-50 sm:text-4xl">
          BE PART OF EVERY EVENT
        </h2>

        {/* Description */}
        <p className="relative mt-3 max-w-md text-base leading-6 text-neutral-400 sm:text-lg">
          Track your attendance, participate,
          and stay updated.
        </p>

        {/* CTA Button */}
        <Link
          to="/register"
          className="relative mt-6 rounded-xl bg-amber-400 px-5 py-3 font-semibold text-neutral-950 transition hover:bg-amber-300 active:scale-[0.98]"
        >
          Register Now
        </Link>

        {/* Phone Image */}
        <div className="relative flex w-full items-end justify-center">
          <img
            src="/phone.png"
            alt="Phone Preview"
            className="mt-6 max-h-56 object-contain opacity-90 drop-shadow-2xl sm:max-h-64"
          />
        </div>

      </div>
    </section>
  );
}
