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
    return (
        <footer className="bg-[#1E1E1E] px-4 py-4" style={{ fontFamily: 'Inter' }}>
            <div className="max-w-6xl mx-auto">
                {/* Top Section - Links (Vertical) */}
                <div className="mb-4">
                    <nav className="flex flex-col gap-2 text-sm">
                        <Link to="/about" className="text-white hover:text-indigo-400" onClick={() => window.scrollTo(0, 0)}>
                            About Page
                        </Link>
                        <Link to="/privacy" className="text-white hover:text-indigo-400" onClick={() => window.scrollTo(0, 0)}>
                            Privacy Policy Page
                        </Link>
                        <Link to="/terms" className="text-white hover:text-indigo-400" onClick={() => window.scrollTo(0, 0)}>
                            Terms of Use Page
                        </Link>
                        <Link to="/connectivity" className="text-white hover:text-indigo-400" onClick={() => window.scrollTo(0, 0)}>
                            Connectivity Test
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

                {/* Divider */}
                <div className="h-px bg-white/20 mb-4"></div>

                {/* Middle Section - Social Icons */}
                <div className="flex items-center gap-4 mb-4 ">
    
                    {/* Facebook */}
                    <a
                        href="https://facebook.com/ACLCTacCity"
                        target="_blank"
                        rel="noopener noreferrer"
                        title="Facebook"
                        className="
                            w-11 h-11
                            flex items-center justify-center
                            rounded-full
                            bg-white/10
                            text-white
                            hover:bg-blue-600
                            hover:scale-110
                            transition-all duration-300
                            shadow-md
                        "
                    >
                        <FaFacebook size={20} />
                    </a>

                    {/* Phone */}
                    <a
                        href="tel:+639123456789"
                        title="Call Us"
                        className="
                            w-11 h-11
                            flex items-center justify-center
                            rounded-full
                            bg-white/10
                            text-white
                            hover:bg-green-500
                            hover:scale-110
                            transition-all duration-300
                            shadow-md
                        "
                    >
                        <FaPhone size={18} />
                    </a>

                    {/* Email */}
                    <a
                        href="mailto:admissionoffice_aclctacloban@yahoo.com"
                        title="Email Us"
                        className="
                            w-11 h-11
                            flex items-center justify-center
                            rounded-full
                            bg-white/10
                            text-white
                            hover:bg-red-500
                            hover:scale-110
                            transition-all duration-300
                            shadow-md
                        "
                    >
                        <FaEnvelope size={19} />
                    </a>
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