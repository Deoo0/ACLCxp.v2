/**
 * OngoingEvents.tsx — Mobile-first rewrite
 *
 * Mobile fixes applied:
 * - Single-column stack on mobile, 2-col on sm, 3-col on lg
 * - Cards use a fixed internal layout — no shrinking content
 * - "View Details" button is 48px tall — thumb-safe
 * - Section padding uses fixed px values, not clamp() which can collapse
 * - Card image is fixed at 180px — never squishes text on narrow screens
 * - Section heading has proper margin rhythm on mobile
 * - Status badge doesn't overflow card edge on 360px screens
 * - Skeleton cards match real card structure exactly
 */

import { useState } from "react";

/* ── Types ── */
export interface Event {
  id:          string;
  title:       string;
  description: string;
  imageUrl?:   string;
  date?:       string;
  status?:     "live" | "upcoming" | "ended";
}

interface OngoingEventsProps {
  events?:  Event[];
  loading?: boolean;
}

/* ── Shimmer keyframes injected once ── */
const SHIMMER_CSS = `
  @keyframes shimmer {
    0%   { background-position: -600px 0; }
    100% { background-position: 600px 0; }
  }
  .shimmer-bg {
    background: linear-gradient(90deg, #e5e7eb 25%, #f0f0f0 50%, #e5e7eb 75%);
    background-size: 600px 100%;
    animation: shimmer 1.4s ease-in-out infinite;
  }
`;

/* ── Skeleton card ── */
function SkeletonCard() {
  return (
    <div
      className="flex flex-col rounded-2xl overflow-hidden bg-white"
      style={{ border: "1px solid #e5e7eb", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}
      aria-hidden="true"
    >
      {/* Image skeleton */}
      <div className="shimmer-bg" style={{ height: "180px", flexShrink: 0 }} />

      {/* Body skeleton */}
      <div className="flex flex-col gap-3 p-4">
        <div className="shimmer-bg rounded-lg" style={{ height: "16px", width: "70%" }} />
        <div className="shimmer-bg rounded-lg" style={{ height: "13px", width: "100%" }} />
        <div className="shimmer-bg rounded-lg" style={{ height: "13px", width: "85%" }} />
        {/* Button skeleton */}
        <div className="shimmer-bg rounded-xl mt-1" style={{ height: "48px" }} />
      </div>
    </div>
  );
}

/* ── Status badge ── */
function StatusBadge({ status }: { status: Event["status"] }) {
  if (!status || status === "ended") return null;

  const cfg = {
    live:     { label: "Live",     dotClass: "bg-green-400", style: { background: "#f0fdf4", color: "#15803d", border: "1px solid #bbf7d0" } },
    upcoming: { label: "Upcoming", dotClass: "bg-amber-400", style: { background: "#fffbeb", color: "#b45309", border: "1px solid #fde68a" } },
  }[status];

  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold"
      style={cfg.style}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full shrink-0 ${cfg.dotClass} ${status === "live" ? "animate-pulse" : ""}`}
        aria-hidden="true"
      />
      {cfg.label}
    </span>
  );
}

/* ── Event card ── */
function EventCard({ event }: { event: Event }) {
  const [imgError, setImgError] = useState(false);

  return (
    <article
      className="flex flex-col rounded-2xl overflow-hidden bg-white"
      style={{
        border: "1px solid #e5e7eb",
        boxShadow: "0 2px 8px rgba(46,48,142,0.07), 0 1px 2px rgba(0,0,0,0.04)",
      }}
    >
      {/* ── Image area — fixed 180px height, never collapses ── */}
      <div className="relative shrink-0" style={{ height: "180px" }}>
        {event.imageUrl && !imgError ? (
          <img
            src={event.imageUrl}
            alt={event.title}
            className="w-full h-full object-cover"
            onError={() => setImgError(true)}
            loading="lazy"
          />
        ) : (
          <div
            className="w-full h-full flex flex-col items-center justify-center gap-2"
            style={{ background: "linear-gradient(135deg,#f3f4f6 0%,#e5e7eb 100%)" }}
          >
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <rect x="3" y="3" width="18" height="18" rx="3" stroke="#9ca3af" strokeWidth="1.5"/>
              <circle cx="8.5" cy="8.5" r="1.5" fill="#9ca3af"/>
              <path d="M3 16l5-5 4 4 3-3 6 6" stroke="#9ca3af" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span className="text-xs font-medium" style={{ color: "#9ca3af" }}>No image</span>
          </div>
        )}

        {/* Status badge — top-left, never overflows */}
        {event.status && event.status !== "ended" && (
          <div className="absolute top-3 left-3">
            <StatusBadge status={event.status} />
          </div>
        )}
      </div>

      {/* ── Body ── */}
      <div className="flex flex-col flex-1 p-4 gap-2">

        {/* Title */}
        <h3
          className="font-semibold leading-snug line-clamp-2"
          style={{
            fontFamily: "'Outfit', sans-serif",
            fontSize: "15px",
            color: "#111827",
          }}
        >
          {event.title}
        </h3>

        {/* Date */}
        {event.date && (
          <div className="flex items-center gap-1.5" style={{ color: "#9ca3af" }}>
            <svg width="12" height="12" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <rect x="2" y="3" width="12" height="11" rx="2" stroke="currentColor" strokeWidth="1.4"/>
              <path d="M5 1v2M11 1v2M2 7h12" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
            </svg>
            <span style={{ fontSize: "12px", fontWeight: 500 }}>{event.date}</span>
          </div>
        )}

        {/* Description */}
        <p className="line-clamp-2 flex-1" style={{ fontSize: "13.5px", color: "#6b7280", lineHeight: 1.55 }}>
          {event.description}
        </p>

        {/* ── View Details button — 48px tall, full width, thumb-safe ── */}
        <button
          className="w-full rounded-xl font-semibold cursor-pointer transition-colors duration-200 mt-2 shrink-0"
          style={{
            height: "48px",
            background: "transparent",
            color: "#2E308E",
            border: "1.5px solid #d1d5db",
            fontFamily: "'DM Sans', sans-serif",
            fontSize: "14px",
          }}
          aria-label={`View details for ${event.title}`}
          onMouseEnter={(e) => {
            const t = e.currentTarget;
            t.style.background = "#2E308E";
            t.style.color = "#fff";
            t.style.borderColor = "#2E308E";
          }}
          onMouseLeave={(e) => {
            const t = e.currentTarget;
            t.style.background = "transparent";
            t.style.color = "#2E308E";
            t.style.borderColor = "#d1d5db";
          }}
        >
          View Details
        </button>
      </div>
    </article>
  );
}

/* ── Empty state ── */
function EmptyState() {
  return (
    <div
      className="col-span-full flex flex-col items-center justify-center text-center rounded-2xl py-14 px-6"
      style={{ border: "1.5px dashed #d1d5db", background: "#fafafa" }}
    >
      <div
        className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
        style={{ background: "rgba(46,48,142,0.07)" }}
        aria-hidden="true"
      >
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
          <rect x="3" y="4" width="18" height="17" rx="3" stroke="#2E308E" strokeWidth="1.6"/>
          <path d="M8 2v2M16 2v2M3 10h18" stroke="#2E308E" strokeWidth="1.6" strokeLinecap="round"/>
          <path d="M8 14h4M8 17h8" stroke="#2E308E" strokeWidth="1.4" strokeLinecap="round"/>
        </svg>
      </div>
      <h3
        className="font-bold mb-1.5"
        style={{ fontFamily: "'Outfit', sans-serif", fontSize: "18px", color: "#1f2937" }}
      >
        No Events Right Now
      </h3>
      <p style={{ fontSize: "14px", color: "#6b7280", maxWidth: "26ch", lineHeight: 1.6 }}>
        There are no ongoing events at the moment. Check back soon.
      </p>
    </div>
  );
}

/* ── Section ── */
export default function OngoingEvents({
  events  = PLACEHOLDER_EVENTS,
  loading = false,
}: OngoingEventsProps) {
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@700;800&family=DM+Sans:wght@400;500;600&display=swap');
        ${SHIMMER_CSS}
      `}</style>

      <section
        className="bg-white"
        aria-labelledby="events-heading"
        style={{
          /* Fixed padding — no clamp that can collapse on mobile */
          padding: "40px 20px 48px",
        }}
      >
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>

          {/* ── Section header ── */}
          <div className="flex flex-col gap-1 mb-7">
            <p
              className="font-bold uppercase"
              style={{
                fontSize: "11px",
                letterSpacing: "0.14em",
                color: "#2E308E",
              }}
            >
              What's happening
            </p>
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <h2
                id="events-heading"
                className="font-black leading-none"
                style={{
                  fontFamily: "'Outfit', sans-serif",
                  fontSize: "30px",
                  color: "#D91B22",
                  letterSpacing: "-0.01em",
                }}
              >
                Ongoing Events
              </h2>

              {/* Live count — only when there are events */}
              {!loading && events.length > 0 && (
                <span
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full"
                  style={{
                    background: "#f9fafb",
                    border: "1px solid #e5e7eb",
                    fontSize: "12.5px",
                    fontWeight: 500,
                    color: "#4b5563",
                    flexShrink: 0,
                  }}
                  aria-live="polite"
                >
                  <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse shrink-0" aria-hidden="true" />
                  {events.length} active
                </span>
              )}
            </div>
          </div>

          {/* ── Card grid ──
              - 1 column on mobile (default)
              - 2 columns at 640px+
              - 3 columns at 1024px+
          ── */}
          <div
            className="grid gap-5"
            style={{
              gridTemplateColumns: "repeat(1, 1fr)",
            }}
            // Use inline media query via CSS class overrides below
          >
            {loading
              ? Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)
              : events.length === 0
              ? <EmptyState />
              : events.map((ev) => <EventCard key={ev.id} event={ev} />)
            }
          </div>

        </div>
      </section>

      {/* ── Responsive grid breakpoints — injected via style tag ── */}
      <style>{`
        @media (min-width: 640px) {
          #events-heading ~ * .grid,
          [aria-labelledby="events-heading"] .grid {
            grid-template-columns: repeat(2, 1fr) !important;
          }
        }
        @media (min-width: 1024px) {
          [aria-labelledby="events-heading"] .grid {
            grid-template-columns: repeat(3, 1fr) !important;
          }
        }
      `}</style>
    </>
  );
}

/* ── Placeholder data — swap with API response ── */
const PLACEHOLDER_EVENTS: Event[] = [
  {
    id: "1",
    title: "Leadership & Excellence Summit",
    description: "Join campus leaders for a full-day summit on student leadership and academic excellence.",
    date: "May 20, 2026",
    status: "live",
  },
  {
    id: "2",
    title: "Tech Innovators Showcase",
    description: "Students present tech projects and compete for recognition. Open to all IT and CS majors.",
    date: "May 22, 2026",
    status: "upcoming",
  },
  {
    id: "3",
    title: "Cultural Arts Festival",
    description: "Celebrate diverse cultures through performances, exhibits, and food.",
    date: "May 25, 2026",
    status: "upcoming",
  },
];