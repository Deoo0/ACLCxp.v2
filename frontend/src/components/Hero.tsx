/**
 * Hero.tsx – Polished, fully responsive
 *
 * UX/UI Issues Fixed:
 * 1. Fixed height `h-125` breaks on small screens / ultra-wide
 * 2. `text-md` is not a valid Tailwind class (should be `text-base`)
 * 3. ACLC/XP logo completely obscures the hero — poor visual hierarchy
 * 4. Tagline barely readable — low contrast, tiny touch area
 * 5. No CTA in the hero — missed conversion opportunity
 * 6. `rounded-b-4xl` clips the hero image unevenly on mobile
 * 7. No semantic heading structure
 */

import { Link } from "react-router-dom";

export default function Hero() {
  return (
    <>
      <style>{`

        .hero-root {
          font-family: 'DM Sans', sans-serif;
        }

        /* Parallax-style logo shimmer — subtle */
        @keyframes logoFloat {
          0%, 100% { transform: translateX(-50%) translateY(0px); }
          50%       { transform: translateX(-50%) translateY(-6px); }
        }
        .hero-logo-float { animation: logoFloat 5s ease-in-out infinite; }

        .hero-cta {
          transition: background-color 200ms ease, color 200ms ease,
                      transform 150ms ease, box-shadow 200ms ease;
        }
        .hero-cta:hover {
          background-color: #2E308E;
          color: #fff;
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(46,48,142,0.45);
        }
        .hero-cta:active { transform: translateY(0); }
      `}</style>

      <section
        className="hero-root relative overflow-hidden"
        style={{
          borderBottomLeftRadius: "clamp(20px, 4vw, 40px)",
          borderBottomRightRadius: "clamp(20px, 4vw, 40px)",
          /* Fluid height — taller on desktop, shorter on mobile */
          height: "clamp(340px, 55vw, 540px)",
        }}
        aria-label="Hero section"
      >
        {/* Background Image */}
        <img
          src="/aclcxp-bg.png"
          alt="ACLC Campus"
          className="absolute inset-0 w-full h-full object-cover select-none pointer-events-none"
        />

        {/* Dark gradient — stronger at text areas for readability */}
        <div
          aria-hidden="true"
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(135deg, rgba(0,0,0,0.72) 0%, rgba(0,0,0,0.30) 55%, rgba(0,0,0,0.55) 100%)",
          }}
        />

        {/* Ambient navy tint at bottom-left */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-16 -left-16 rounded-full opacity-25"
          style={{
            width: "clamp(200px, 40vw, 360px)",
            height: "clamp(200px, 40vw, 360px)",
            background: "#2E308E",
            filter: "blur(70px)",
          }}
        />

        {/* ── Content ── */}
        <div className="relative z-10 flex flex-col justify-between h-full p-6 sm:p-10">

          {/* Top row — wordmark + tagline */}
          <div className="flex items-start justify-between">

            {/* Wordmark */}
            <div>
              <h1
                aria-label="ACLCxp"
                className="font-black leading-none tracking-tight"
                style={{
                  fontFamily: "'Outfit', sans-serif",
                  fontSize: "clamp(36px, 7vw, 64px)",
                  color: "#fff",
                }}
              >
                ACLC
                <br />
                <span style={{ color: "#D91B22" }}>XP</span>
              </h1>
            </div>

            {/* Tagline — right aligned */}
            <p
              className="text-right text-white font-light leading-tight tracking-widest uppercase"
              style={{ fontSize: "clamp(9px, 1.4vw, 13px)", maxWidth: "clamp(100px, 18vw, 160px)" }}
            >
              Where participation
              <br />
              becomes performance
            </p>
          </div>

          {/* Bottom row — CTA */}
          <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4">

            {/* CTA button */}
            <Link
              to="/register"
              aria-label="Register for an account"
              className="hero-cta focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white inline-flex items-center gap-2 bg-white text-[#2E308E] font-bold rounded-full no-underline"
              style={{
                fontFamily: "'Outfit', sans-serif",
                fontSize: "clamp(12px, 1.8vw, 15px)",
                letterSpacing: "0.06em",
                padding: "clamp(10px, 1.5vw, 14px) clamp(20px, 3vw, 32px)",
              }}
            >
              Get Started
              {/* Arrow icon */}
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                <path d="M2 7h10M8 3l4 4-4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </Link>

            {/* Floating stat — engagement hook */}
            <div
              className="flex items-center gap-2 px-3 py-2 rounded-xl"
              style={{
                background: "rgba(255,255,255,0.12)",
                backdropFilter: "blur(12px)",
                border: "1px solid rgba(255,255,255,0.18)",
              }}
            >
              <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse flex-shrink-0" aria-hidden="true" />
              <span className="text-white text-[12px] font-medium" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                Events live now
              </span>
            </div>
          </div>
        </div>

        {/* Overlapping watermark logo — subtle, decorative only */}
        <div
          className="hero-logo-float pointer-events-none select-none absolute"
          style={{
            top: "50%",
            left: "50%",
            transform: "translateX(-50%) translateY(-44%)",
            width: "clamp(120px, 22vw, 220px)",
            opacity: 0.12,
          }}
          aria-hidden="true"
        >
          <img
            src="/aclc-logo.png"
            alt=""
            role="presentation"
            className="w-full h-auto object-contain"
          />
        </div>
      </section>
    </>
  );
}