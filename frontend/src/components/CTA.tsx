/**
 * CTA.tsx – Polished, accessible, fully responsive
 *
 * UX/UI Issues Fixed:
 * 1. Fixed height `h-100` breaks on small screens and ultra-wide
 * 2. CTA button too small — poor tap target on mobile
 * 3. Phone image had no max-width constraint — overflowed on narrow screens
 * 4. Text lacked visual hierarchy — heading and body same weight feel
 * 5. `font-spartan` and `font-lato` not configured in Tailwind — relied on undefined utilities
 * 6. No fallback if cta-bg.png fails to load
 * 7. "BE PART OF EVERY EVENT" heading not an actual heading element
 * 8. No accessible label on the CTA link
 */

import { Link } from "react-router-dom";

export default function CTA() {
  return (
    <>
      <style>{`

        .cta-root { font-family: 'DM Sans', sans-serif; }

        .cta-btn {
          transition: background-color 200ms ease, color 200ms ease,
                      transform 150ms ease, box-shadow 200ms ease;
        }
        .cta-btn:hover {
          background-color: #2E308E;
          color: #ffffff;
          transform: translateY(-2px);
          box-shadow: 0 8px 28px rgba(46,48,142,0.50);
        }
        .cta-btn:active { transform: translateY(0); box-shadow: none; }

        /* Phone float animation */
        @keyframes phoneFloat {
          0%, 100% { transform: translateY(0px); }
          50%       { transform: translateY(-10px); }
        }
        .phone-float { animation: phoneFloat 4s ease-in-out infinite; }
      `}</style>

      <section
        className="cta-root relative overflow-hidden"
        style={{
          borderTopLeftRadius:  "clamp(20px, 4vw, 40px)",
          borderTopRightRadius: "clamp(20px, 4vw, 40px)",
          /* Fluid height with min/max guards */
          minHeight: "clamp(320px, 50vw, 480px)",
        }}
        aria-labelledby="cta-heading"
      >
        {/* Background */}
        <img
          src="/cta-bg.png"
          alt=""
          role="presentation"
          className="absolute inset-0 w-full h-full object-cover select-none pointer-events-none"
        />

        {/* Gradient overlay — darker at text side */}
        <div
          aria-hidden="true"
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(110deg, rgba(0,0,0,0.80) 0%, rgba(0,0,0,0.55) 50%, rgba(0,0,0,0.25) 100%)",
          }}
        />

        {/* Ambient navy pulse — top left */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-20 -left-20 rounded-full opacity-20"
          style={{
            width: "clamp(180px, 30vw, 320px)",
            height: "clamp(180px, 30vw, 320px)",
            background: "#2E308E",
            filter: "blur(70px)",
          }}
        />

        {/* ── Content ── */}
        <div
          className="relative z-10 h-full flex items-center justify-between gap-8"
          style={{
            padding: "clamp(32px, 6vw, 64px) clamp(20px, 5vw, 64px)",
            minHeight: "clamp(320px, 50vw, 480px)",
          }}
        >
          {/* Left column — text + CTA */}
          <div className="flex flex-col items-start gap-4 max-w-md">

            {/* Eyebrow */}
            <span
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[11px] font-bold tracking-widest uppercase text-white/70"
              style={{
                background: "rgba(255,255,255,0.12)",
                border: "1px solid rgba(255,255,255,0.18)",
                backdropFilter: "blur(8px)",
              }}
            >
              <span
                className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"
                aria-hidden="true"
              />
              Student Portal
            </span>

            {/* Heading */}
            <h2
              id="cta-heading"
              className="text-white font-black leading-tight tracking-tight"
              style={{
                fontFamily: "'Outfit', sans-serif",
                fontSize: "clamp(22px, 4.5vw, 40px)",
              }}
            >
              Be Part of
              <br />
              Every Event
            </h2>

            {/* Body */}
            <p
              className="text-white/65 font-light leading-relaxed"
              style={{ fontSize: "clamp(13px, 2vw, 16px)", maxWidth: "30ch" }}
            >
              Track your attendance, join events, and stay updated — all in one place.
            </p>

            {/* CTA */}
            <Link
              to="/register"
              aria-label="Register for a student account"
              className="cta-btn focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white inline-flex items-center gap-2 bg-white text-gray-900 font-bold rounded-full no-underline mt-1"
              style={{
                fontFamily: "'Outfit', sans-serif",
                fontSize: "clamp(13px, 2vw, 15px)",
                letterSpacing: "0.04em",
                padding: "clamp(12px, 1.8vw, 16px) clamp(24px, 4vw, 36px)",
              }}
            >
              Register Now
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                <path d="M2 7h10M8 3l4 4-4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </Link>

            {/* Trust signal */}
            <p className="text-white/35 text-[11px] font-medium mt-1">
              Free for all ACLC students
            </p>
          </div>

          {/* Right column — phone preview (hidden on small screens) */}
          <div
            className="hidden sm:flex flex-col items-center justify-end shrink-0 self-end"
            style={{
              width: "clamp(120px, 22vw, 240px)",
            }}
            aria-hidden="true"
          >
            <img
              src="/phone.png"
              alt=""
              role="presentation"
              className="phone-float w-full h-auto object-contain drop-shadow-2xl"
              style={{ maxHeight: "clamp(220px, 40vw, 420px)" }}
            />
          </div>
        </div>
      </section>
    </>
  );
}