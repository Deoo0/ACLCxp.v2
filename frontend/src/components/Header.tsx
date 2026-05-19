import { Link } from "react-router-dom";
import { useNavigate, useLocation } from "react-router-dom";

export default function Header() {
  const navigate  = useNavigate();
  const location  = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [logoPressed, setLogoPressed] = useState(false);


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
        <header
            className={`fixed top-0 w-full z-50 bg-[#2E308E] backdrop-blur-sm border-b border-white/10 px-4 py-2 transition-transform duration-300`}
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