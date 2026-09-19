import { useEffect, useState } from "react";
import UserNavBar from "../navigation/UserNavBar";
import BottomNavigation from "../navigation/BottomNavigation";
import PageTransition from "../feedback/PageTransition";
import { useAuth } from "../../context/AuthContext";
import { HiHome, HiCalendar, HiAcademicCap, HiUser, HiQrcode } from "react-icons/hi";
import { ScanLine, ShieldCheck, Sparkles, X } from "lucide-react";

export default function UserLayout() {
  const { user } = useAuth();
  const [qrOpen, setQrOpen] = useState(false);
  const [isEntering, setIsEntering] = useState(true);

  useEffect(() => {
    const frame = requestAnimationFrame(() => setIsEntering(false));
    return () => cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    const openStudentPass = () => setQrOpen(true);
    window.addEventListener("aclcxp:open-student-qr", openStudentPass);
    return () => window.removeEventListener("aclcxp:open-student-qr", openStudentPass);
  }, []);

  // You'll need to add the QRModal component here (copy it from ProfilePage)
  function QRPlaceholder({ size = 128 }: { size?: number }) {
  const cells = [
    [1,1,1,1,1,1,1,0,1,0,1,0,1,0,1,1,1,1,1,1,1],
    [1,0,0,0,0,0,1,0,0,1,0,1,0,0,1,0,0,0,0,0,1],
    [1,0,1,1,1,0,1,0,1,0,1,0,1,0,1,0,1,1,1,0,1],
    [1,0,1,1,1,0,1,0,0,1,1,0,0,0,1,0,1,1,1,0,1],
    [1,0,1,1,1,0,1,0,1,1,0,1,1,0,1,0,1,1,1,0,1],
    [1,0,0,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,0,0,1],
    [1,1,1,1,1,1,1,0,1,0,1,0,1,0,1,1,1,1,1,1,1],
    [0,0,0,0,0,0,0,0,1,0,0,1,0,0,0,0,0,0,0,0,0],
    [1,0,1,1,0,1,1,1,0,1,1,0,1,1,1,0,1,1,0,1,0],
    [0,1,0,0,1,0,0,0,1,0,0,1,0,0,0,1,0,0,1,0,1],
    [1,1,1,0,1,1,1,1,0,1,0,0,1,1,0,1,1,0,1,1,0],
    [0,0,1,1,0,0,0,0,1,0,1,0,0,1,1,0,0,1,0,0,1],
    [1,0,0,1,1,0,1,1,0,0,1,1,0,0,1,1,0,0,1,0,1],
    [0,0,0,0,0,0,0,0,1,1,0,0,1,0,0,0,1,1,0,1,0],
    [1,1,1,1,1,1,1,0,0,1,1,0,1,0,1,0,0,1,1,0,1],
    [1,0,0,0,0,0,1,0,1,0,0,1,0,1,0,1,0,0,0,1,0],
    [1,0,1,1,1,0,1,0,0,1,0,0,1,1,1,0,1,1,0,0,1],
    [1,0,1,1,1,0,1,1,1,0,1,0,0,0,1,1,0,0,1,0,0],
    [1,0,1,1,1,0,1,0,0,1,1,1,0,1,0,0,1,0,1,1,1],
    [1,0,0,0,0,0,1,0,1,0,0,0,1,0,1,0,0,1,0,0,0],
    [1,1,1,1,1,1,1,0,0,1,0,1,0,1,0,1,1,0,1,0,1],
  ];

  const cols = cells[0].length;
  const cell = size / cols;

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      xmlns="http://www.w3.org/2000/svg"
      shapeRendering="crispEdges"
    >
      <rect width={size} height={size} fill="white" />
      {cells.flatMap((row, r) =>
        row.map((val, c) =>
          val ? (
            <rect
              key={`${r}-${c}`}
              x={c * cell}
              y={r * cell}
              width={cell}
              height={cell}
              fill="#1a1a1a"
            />
          ) : null
        )
      )}
    </svg>
  );
}

interface QRModalProps {
  name: string;
  studentId: string;
  photo: string | null;
  initials: string;
  houseColor: string;
  houseName?: string;
  onClose: () => void;
}

function QRModal({ name, studentId, photo, initials, houseColor, houseName, onClose }: QRModalProps) {
  return (
    <div className="fixed inset-0 overflow-y-auto bg-[#08090d] text-neutral-100" style={{ zIndex: 2147483647 }} role="dialog" aria-modal="true" aria-label="Student event pass">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="qr-orbit absolute -left-24 top-20 h-64 w-64 rounded-full blur-3xl" style={{ backgroundColor: `${houseColor}2e` }} />
        <div className="absolute -right-28 bottom-8 h-72 w-72 rounded-full bg-amber-400/[0.07] blur-3xl" />
      </div>

      <div className="relative mx-auto flex min-h-full w-full max-w-xl flex-col px-4 py-5 sm:px-6 sm:py-7">
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.05] text-amber-400"><Sparkles className="h-5 w-5" /></div>
            <div><p className="text-[11px] font-medium uppercase tracking-[0.18em] text-neutral-500">ACLCxp</p><h1 className="text-sm font-semibold text-neutral-100">My Event Pass</h1></div>
          </div>
          <button type="button" onClick={onClose} className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-white/[0.05] text-neutral-300 transition hover:bg-white/[0.1] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400" aria-label="Close event pass"><X className="h-5 w-5" /></button>
        </header>

        <main className="qr-pass-enter my-auto py-7 sm:py-9">
          <section className="overflow-hidden rounded-3xl border border-white/10 bg-neutral-900/90 shadow-2xl shadow-black/40">
            <div className="relative border-b border-white/[0.08] px-5 pb-5 pt-6 sm:px-7">
              <div className="absolute inset-x-0 top-0 h-1" style={{ background: `linear-gradient(90deg, transparent, ${houseColor}, transparent)` }} />
              <div className="flex items-center gap-4">
                <div className="relative shrink-0">
                  <div className="qr-pulse-ring absolute -inset-2 rounded-full border" style={{ borderColor: `${houseColor}66` }} />
                  <div className="h-16 w-16 overflow-hidden rounded-full border-2 border-white/20 shadow-lg" style={{ backgroundColor: houseColor }}>
                    {photo ? <img src={photo} alt={name} className="h-full w-full object-cover" /> : <div className="flex h-full w-full items-center justify-center text-xl font-bold text-neutral-950">{initials}</div>}
                  </div>
                </div>
                <div className="min-w-0"><p className="text-[11px] font-medium uppercase tracking-wider text-neutral-500">Student pass</p><h2 className="mt-1 truncate text-xl font-semibold tracking-tight text-neutral-50">{name}</h2><p className="mt-1 font-mono text-xs tracking-widest text-neutral-400">{studentId}</p></div>
              </div>
              {houseName && <div className="mt-5 inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium" style={{ borderColor: `${houseColor}55`, backgroundColor: `${houseColor}18`, color: houseColor }}><span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: houseColor }} />{houseName}</div>}
            </div>

            <div className="px-5 py-6 sm:px-7 sm:py-7">
              <div className="flex items-center justify-between"><div><p className="text-sm font-semibold text-neutral-100">Ready to check in</p><p className="mt-1 text-xs text-neutral-500">Present this code to your event facilitator.</p></div><span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-400/10 px-2.5 py-1 text-[11px] font-medium text-emerald-300"><span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />Active</span></div>

              <div className="relative mx-auto mt-6 w-fit rounded-3xl bg-white p-4 shadow-[0_0_0_1px_rgba(255,255,255,0.1),0_18px_50px_rgba(0,0,0,0.35)] sm:p-5">
                <QRPlaceholder size={220} />
                <div className="pointer-events-none absolute inset-4 overflow-hidden rounded-xl sm:inset-5"><span className="qr-scan-line absolute inset-x-0 h-px bg-amber-400/90 shadow-[0_0_12px_3px_rgba(251,191,36,0.65)]" /></div>
              </div>

              <div className="mt-6 grid grid-cols-2 gap-3">
                <div className="rounded-2xl border border-white/[0.07] bg-white/[0.03] p-3.5"><ScanLine className="h-4 w-4 text-amber-400" /><p className="mt-2 text-xs font-medium text-neutral-200">Scan to check in</p><p className="mt-1 text-[11px] leading-4 text-neutral-500">One scan records your attendance.</p></div>
                <div className="rounded-2xl border border-white/[0.07] bg-white/[0.03] p-3.5"><ShieldCheck className="h-4 w-4 text-emerald-400" /><p className="mt-2 text-xs font-medium text-neutral-200">Merit protected</p><p className="mt-1 text-[11px] leading-4 text-neutral-500">Your points update automatically.</p></div>
              </div>
            </div>
          </section>
        </main>

        <p className="pb-1 text-center text-xs text-neutral-600">Keep this screen open until your attendance is confirmed.</p>
      </div>
    </div>
  );
}
  return (
    <>
      <div className="min-h-screen w-full bg-neutral-950">
        <div
          className={`pointer-events-none fixed inset-0 z-[55] bg-neutral-950 transition-opacity duration-300 ${isEntering ? "opacity-100" : "opacity-0"}`}
          aria-hidden="true"
        />
        <div className="h-[74px] lg:h-20">
          <UserNavBar />
        </div>

        <main className="w-full px-0 pt-0 pb-28 lg:pb-0">
          <PageTransition />
        </main>

        <BottomNavigation
          items={[
            { label: "Dashboard", path: "/dashboard", icon: HiHome },
            { label: "Merit", path: "/merit", icon: HiAcademicCap },
            { label: "Events", path: "/events", icon: HiCalendar },
            { label: "Profile", path: "/profile", icon: HiUser },
          ]}
          centerAction={{
            label: "QR Code",
            icon: HiQrcode,
            onClick: () => setQrOpen(true),
          }}
        />

        {qrOpen && user && (
          <QRModal
            name={user.full_name}
            studentId={user.student_id}
            photo={user.profile_photo || null}
            initials={`${user.first_name?.[0] ?? ""}${user.last_name?.[0] ?? ""}`.toUpperCase()}
            houseColor={user.house_color ?? "#2E308E"}
            houseName={user.house_name}
            onClose={() => setQrOpen(false)}
          />
        )}
      </div>
    </>
  );
}
