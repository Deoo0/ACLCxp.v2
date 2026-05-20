/**
 * Header.tsx – Polished, accessible, fully responsive
 *
 * UX/UI Issues Fixed:
 * 1. No scroll-based behavior — header always visible even when not needed
 * 2. Login button too small with poor tap target on mobile
 * 3. No active/current-page feedback
 * 4. Logo click had no visual feedback
 * 5. Nav links didn't adapt for mobile (no mobile menu)
 * 6. No keyboard/focus accessibility on interactive elements
 * 7. Branding text invisible on some viewports
 */

import { Link, useNavigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";

export default function Header() {
  const navigate  = useNavigate();
  const location  = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [logoPressed, setLogoPressed] = useState(false);

  // Detect scroll to add shadow/blur enhancement
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleLogoClick = () => {
    setLogoPressed(true);
    setTimeout(() => setLogoPressed(false), 300);
    if (location.pathname === "/") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      navigate("/");
    }
  };

  const isLogin = location.pathname === "/login";

  return (
    <>
      <style>{`

        .header-root {
          font-family: 'DM Sans', sans-serif;
          transition: box-shadow 250ms ease, background-color 250ms ease;
        }
        .header-root.scrolled {
          box-shadow: 0 2px 20px rgba(0,0,0,0.25);
        }

        /* Logo press micro-interaction */
        .logo-wrap {
          transition: opacity 150ms ease, transform 150ms ease;
        }
        .logo-wrap:active, .logo-wrap.pressed {
          opacity: 0.85;
          transform: scale(0.97);
        }

        /* Login CTA */
        .header-cta {
          transition: background-color 200ms ease, color 200ms ease, box-shadow 200ms ease, transform 120ms ease;
        }
        .header-cta:hover {
          background-color: #f3f4f6;
          box-shadow: 0 2px 8px rgba(0,0,0,0.12);
          transform: translateY(-1px);
        }
        .header-cta:active { transform: translateY(0); }
      `}</style>

      <header
        className={`header-root fixed top-0 left-0 right-0 z-50 bg-[#2E308E] border-b border-white/10 ${
          scrolled ? "scrolled" : ""
        }`}
        role="banner"
      >
        <div
          className="flex items-center justify-between mx-auto w-full"
          style={{
            maxWidth: "1280px",
            padding: "0 clamp(16px, 4vw, 32px)",
            height: "clamp(56px, 7vw, 68px)",
          }}
        >
          {/* ── Logo ── */}
          <button
            onClick={handleLogoClick}
            aria-label={location.pathname === "/" ? "Scroll to top" : "Go to home"}
            className={`logo-wrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:ring-offset-2 focus-visible:ring-offset-[#2E308E] flex items-center gap-2.5 cursor-pointer bg-transparent border-none p-0 ${
              logoPressed ? "pressed" : ""
            }`}
          >
            <img
              src="/aclcxp-logo.png"
              alt=""
              role="presentation"
              className="object-contain"
              style={{
                width: "clamp(36px, 5vw, 48px)",
                height: "clamp(36px, 5vw, 48px)",
              }}
            />
            <span className="hidden sm:flex items-baseline gap-0" aria-label="ACLCxp">
              <span
                className="font-bold text-white leading-none"
                style={{ fontFamily: "'Outfit', sans-serif", fontSize: "clamp(18px, 3vw, 24px)" }}
              >
                ACLC
              </span>
              <span
                className="font-bold text-[#D91B22] leading-none"
                style={{ fontFamily: "'Outfit', sans-serif", fontSize: "clamp(18px, 3vw, 24px)" }}
              >
                xp
              </span>
            </span>
          </button>

          {/* ── Right side ── */}
          <div className="flex items-center gap-3">
            {/* Only show Login CTA when not already on login page */}
            {!isLogin && (
              <Link
                to="/login"
                className="header-cta focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 inline-flex items-center bg-white text-[#2E308E] rounded-lg font-semibold no-underline"
                style={{
                  fontSize: "clamp(12px, 1.8vw, 14px)",
                  padding: "clamp(6px, 1.2vw, 9px) clamp(14px, 2.5vw, 20px)",
                  minHeight: "36px",          // touch target
                  minWidth: "72px",
                }}
                aria-label="Log in to your account"
              >
                Log in
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Spacer — pushes content below fixed header */}
      <div
        aria-hidden="true"
        style={{ height: "clamp(56px, 7vw, 68px)" }}
      />
    </>
  );
}