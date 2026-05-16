/**
 * Footer.tsx – Polished, accessible, fully responsive
 *
 * UX/UI Issues Fixed:
 * 1. Social icons had no labels — invisible to screen readers
 * 2. Links and icons had no hover/focus state feedback
 * 3. No visual grouping — nav links + socials looked like one flat list
 * 4. Social icon row had no labels or tooltips — users can't tell what they link to
 * 5. Copyright text lacked sub-branding
 * 6. `style={{ fontFamily: 'Inter' }}` inline on footer — inconsistent with design system
 * 7. No accessible landmark role (`contentinfo`)
 * 8. Touch targets for icon-only buttons were too small (< 44×44px)
 * 9. Link colors were plain white with no differentiation from body text
 */

import { Link } from "react-router-dom";
import { FaFacebook, FaPhone, FaEnvelope } from "react-icons/fa";

/* ── Types ── */
interface NavLink { label: string; href: string; external?: boolean; isRouter?: boolean; }
interface SocialLink { label: string; href: string; icon: React.ReactNode; }

/* ── Data ── */
const NAV_LINKS: NavLink[] = [
  { label: "About",            href: "#about" },
  { label: "Terms of Use",     href: "#terms" },
  { label: "Privacy Policy",   href: "#privacy" },
  { label: "Connectivity Test", href: "/connectivity", isRouter: true },
];

const SOCIAL_LINKS: SocialLink[] = [
  {
    label: "Follow us on Facebook",
    href:  "https://facebook.com/ACLCTacCity",
    icon:  <FaFacebook aria-hidden="true" size={20} />,
  },
  {
    label: "Call us",
    href:  "tel:+639123456789",
    icon:  <FaPhone aria-hidden="true" size={18} />,
  },
  {
    label: "Email us",
    href:  "mailto:admissionoffice_aclctacloban@yahoo.com",
    icon:  <FaEnvelope aria-hidden="true" size={20} />,
  },
];

/* ── Social icon button ── */
function SocialButton({ link }: { link: SocialLink }) {
  return (
    <a
      href={link.href}
      target={link.href.startsWith("http") ? "_blank" : undefined}
      rel={link.href.startsWith("http") ? "noopener noreferrer" : undefined}
      aria-label={link.label}
      title={link.label}
      className="social-btn focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50 flex items-center justify-center rounded-xl text-white/60 transition-all duration-200"
      style={{
        width: "44px",           // touch target
        height: "44px",
        background: "rgba(255,255,255,0.06)",
        border: "1px solid rgba(255,255,255,0.10)",
      }}
    >
      {link.icon}
    </a>
  );
}

/* ── Footer ── */
export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <>
      <style>{`

        .footer-root { font-family: 'DM Sans', sans-serif; }

        .footer-nav-link {
          color: rgba(255,255,255,0.55);
          text-decoration: none;
          font-size: 13.5px;
          transition: color 150ms ease;
          width: fit-content;
        }
        .footer-nav-link:hover { color: rgba(255,255,255,0.92); }
        .footer-nav-link:focus-visible { outline: 2px solid rgba(255,255,255,0.5); outline-offset: 2px; border-radius: 3px; }

        .social-btn:hover {
          background: rgba(255,255,255,0.13) !important;
          border-color: rgba(255,255,255,0.22) !important;
          color: white;
        }
      `}</style>

      <footer
        className="footer-root bg-[#1E1E1E]"
        role="contentinfo"
        aria-label="Site footer"
        style={{ padding: "clamp(28px, 5vw, 48px) clamp(16px, 5vw, 48px) clamp(20px, 4vw, 36px)" }}
      >
        <div className="max-w-6xl mx-auto flex flex-col gap-6">

          {/* ── Top: Logo + nav + social ── */}
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-8">

            {/* Brand */}
            <div className="flex flex-col gap-3">
              <Link
                to="/"
                className="flex items-baseline gap-0 no-underline w-fit focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 rounded"
                aria-label="ACLCxp home"
              >
                <span
                  className="font-black text-white"
                  style={{ fontFamily: "'Outfit', sans-serif", fontSize: "22px" }}
                >
                  ACLC
                </span>
                <span
                  className="font-black"
                  style={{ fontFamily: "'Outfit', sans-serif", fontSize: "22px", color: "#D91B22" }}
                >
                  xp
                </span>
              </Link>
              <p className="text-white/35 text-[12.5px] leading-relaxed max-w-[200px]">
                Where participation becomes performance.
              </p>
            </div>

            {/* Nav + Social — right side */}
            <div className="flex flex-col sm:flex-row gap-8">

              {/* Nav links */}
              <nav aria-label="Footer navigation">
                <ul className="flex flex-col gap-2.5 list-none p-0 m-0">
                  {NAV_LINKS.map((link) => (
                    <li key={link.label}>
                      {link.isRouter ? (
                        <Link to={link.href} className="footer-nav-link">
                          {link.label}
                        </Link>
                      ) : (
                        <a href={link.href} className="footer-nav-link">
                          {link.label}
                        </a>
                      )}
                    </li>
                  ))}
                </ul>
              </nav>

              {/* Social icons */}
              <div className="flex flex-col gap-3">
                <p className="text-white/30 text-[11px] font-semibold tracking-[0.1em] uppercase">
                  Connect
                </p>
                <div className="flex gap-2.5" role="list" aria-label="Social media links">
                  {SOCIAL_LINKS.map((link) => (
                    <div key={link.label} role="listitem">
                      <SocialButton link={link} />
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>

          {/* ── Divider ── */}
          <div
            className="h-px"
            style={{ background: "rgba(255,255,255,0.08)" }}
            role="separator"
            aria-hidden="true"
          />

          {/* ── Bottom: copyright ── */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <p className="text-white/30 text-[12.5px]">
              © {year} ACLCxp. All rights reserved.
            </p>
            <p className="text-white/20 text-[11.5px]">
              ACLC Tacloban City Campus
            </p>
          </div>

        </div>
      </footer>
    </>
  );
}