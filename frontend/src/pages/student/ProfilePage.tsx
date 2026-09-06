import { useRef, useState } from "react";
import { Camera, CheckCircle2, GraduationCap, IdCard, Mail, QrCode, ShieldCheck, Sparkles } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

const YEAR_LABELS: Record<number, string> = { 1: "1st Year", 2: "2nd Year", 3: "3rd Year", 4: "4th Year" };
const ROLE_LABELS: Record<string, string> = { STUDENT: "Student", FACILITATOR: "Facilitator", ORGANIZER: "Event Organizer", HOUSE_LEADER: "House Leader", ADMIN: "Administrator" };

function QRPlaceholder({ size = 112 }: { size?: number }) {
  const cells = [
    [1,1,1,1,1,1,1,0,1,0,1,0,1,0,1,1,1,1,1,1,1],[1,0,0,0,0,0,1,0,0,1,0,1,0,0,1,0,0,0,0,0,1],[1,0,1,1,1,0,1,0,1,0,1,0,1,0,1,0,1,1,1,0,1],[1,0,1,1,1,0,1,0,0,1,1,0,0,0,1,0,1,1,1,0,1],[1,0,1,1,1,0,1,0,1,1,0,1,1,0,1,0,1,1,1,0,1],[1,0,0,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,0,0,1],[1,1,1,1,1,1,1,0,1,0,1,0,1,0,1,1,1,1,1,1,1],[0,0,0,0,0,0,0,0,1,0,0,1,0,0,0,0,0,0,0,0,0],[1,0,1,1,0,1,1,1,0,1,1,0,1,1,1,0,1,1,0,1,0],[0,1,0,0,1,0,0,0,1,0,0,1,0,0,0,1,0,0,1,0,1],[1,1,1,0,1,1,1,1,0,1,0,0,1,1,0,1,1,0,1,1,0],[0,0,1,1,0,0,0,0,1,0,1,0,0,1,1,0,0,1,0,0,1],[1,0,0,1,1,0,1,1,0,0,1,1,0,0,1,1,0,0,1,0,1],[0,0,0,0,0,0,0,0,1,1,0,0,1,0,0,0,1,1,0,1,0],[1,1,1,1,1,1,1,0,0,1,1,0,1,0,1,0,0,1,1,0,1],[1,0,0,0,0,0,1,0,1,0,0,1,0,1,0,1,0,0,0,1,0],[1,0,1,1,1,0,1,0,0,1,0,0,1,1,1,0,1,1,0,0,1],[1,0,1,1,1,0,1,1,1,0,1,0,0,0,1,1,0,0,1,0,0],[1,0,1,1,1,0,1,0,0,1,1,1,0,1,0,0,1,0,1,1,1],[1,0,0,0,0,0,1,0,1,0,0,0,1,0,1,0,0,1,0,0,0],[1,1,1,1,1,1,1,0,0,1,0,1,0,1,0,1,1,0,1,0,1],
  ];
  const cell = size / cells[0].length;
  return <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} xmlns="http://www.w3.org/2000/svg" shapeRendering="crispEdges"><rect width={size} height={size} fill="white" />{cells.flatMap((row, rowIndex) => row.map((value, columnIndex) => value ? <rect key={`${rowIndex}-${columnIndex}`} x={columnIndex * cell} y={rowIndex * cell} width={cell} height={cell} fill="#111111" /> : null))}</svg>;
}

function DetailRow({ icon: Icon, label, value }: { icon: typeof Mail; label: string; value: string }) {
  return <div className="flex min-w-0 items-center gap-3 py-3.5"><div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/[0.05] text-neutral-400"><Icon className="h-4 w-4" /></div><div className="min-w-0"><p className="text-[11px] font-medium uppercase tracking-wider text-neutral-500">{label}</p><p className="mt-0.5 truncate text-sm font-medium text-neutral-200">{value}</p></div></div>;
}

export default function ProfilePage() {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [localPhoto, setLocalPhoto] = useState<string | null>(null);

  if (!user) return null;

  const initials = `${user.first_name?.[0] ?? ""}${user.last_name?.[0] ?? ""}`.toUpperCase() || "S";
  const photoSrc = localPhoto ?? user.profile_photo;
  const houseColor = user.house_color || "#F5B300";
  const openEventPass = () => window.dispatchEvent(new Event("aclcxp:open-student-qr"));
  const handlePhotoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setLocalPhoto(reader.result as string);
    reader.readAsDataURL(file);
  };

  return (
    <div className="min-h-[calc(100vh-80px)] bg-neutral-950 text-neutral-200">
      <main className="mx-auto w-full max-w-5xl space-y-5 px-4 py-6 sm:space-y-6 sm:px-6 sm:py-8 lg:px-8">
        <header><p className="text-sm text-neutral-400">Your account</p><h1 className="mt-1 text-2xl font-semibold tracking-tight text-neutral-50 sm:text-3xl">Profile &amp; student pass</h1></header>

        <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-neutral-900/70 p-5 sm:p-7">
          <div className="pointer-events-none absolute -right-16 -top-16 h-52 w-52 rounded-full blur-3xl" style={{ backgroundColor: `${houseColor}2f` }} />
          <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center">
            <div className="relative mx-auto shrink-0 sm:mx-0">
              <div className="h-24 w-24 overflow-hidden rounded-full border-4 border-white/15 shadow-xl" style={{ backgroundColor: houseColor }}>{photoSrc ? <img src={photoSrc} alt={user.full_name} className="h-full w-full object-cover" /> : <div className="flex h-full w-full items-center justify-center text-3xl font-bold text-neutral-950">{initials}</div>}</div>
              <button type="button" onClick={() => fileInputRef.current?.click()} className="absolute -bottom-1 -right-1 flex h-9 w-9 items-center justify-center rounded-full border-2 border-neutral-900 bg-amber-400 text-neutral-950 shadow-lg transition hover:bg-amber-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300" aria-label="Choose profile photo"><Camera className="h-4 w-4" /></button>
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
            </div>
            <div className="min-w-0 text-center sm:text-left"><div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start"><h2 className="truncate text-xl font-semibold text-neutral-50 sm:text-2xl">{user.full_name}</h2><span className="rounded-full bg-white/[0.07] px-2.5 py-1 text-[11px] font-medium text-neutral-400">{ROLE_LABELS[user.role] || user.role}</span></div><p className="mt-1 font-mono text-xs tracking-widest text-neutral-500">{user.student_id}</p><div className="mt-4 inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-medium" style={{ borderColor: `${houseColor}55`, backgroundColor: `${houseColor}16`, color: houseColor }}><span className="h-2 w-2 rounded-full" style={{ backgroundColor: houseColor }} />{user.house_name || "House unassigned"}</div></div>
          </div>
        </section>

        <div className="grid gap-5 lg:grid-cols-[1.1fr_.9fr] lg:gap-6">
          <section className="rounded-2xl border border-white/10 bg-neutral-900/60 p-5 sm:p-6"><div className="flex items-center gap-2"><IdCard className="h-5 w-5 text-amber-400" /><div><h2 className="text-base font-semibold text-neutral-100">Student details</h2><p className="mt-0.5 text-sm text-neutral-500">Your enrolled account information.</p></div></div><div className="mt-4 divide-y divide-white/[0.07]"><DetailRow icon={Mail} label="Email" value={user.email} /><DetailRow icon={GraduationCap} label="Program" value={user.program} /><DetailRow icon={Sparkles} label="Year level" value={YEAR_LABELS[user.year_level] || `Year ${user.year_level}`} /></div><p className="mt-3 text-xs text-neutral-600">Profile photo changes are previewed locally in this session.</p></section>

          <section className="rounded-2xl border border-white/10 bg-neutral-900/60 p-5 sm:p-6"><div className="flex items-start justify-between gap-4"><div><div className="flex items-center gap-2"><QrCode className="h-5 w-5 text-amber-400" /><h2 className="text-base font-semibold text-neutral-100">Event pass</h2></div><p className="mt-1 text-sm leading-5 text-neutral-500">Use your QR code for quick, verified event check-ins.</p></div><span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-400/10 px-2.5 py-1 text-[11px] font-medium text-emerald-300"><CheckCircle2 className="h-3.5 w-3.5" />Active</span></div><button type="button" onClick={openEventPass} className="mt-5 flex w-full items-center justify-between rounded-2xl border border-white/[0.08] bg-neutral-950/50 p-4 text-left transition hover:border-amber-400/30 hover:bg-white/[0.04] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"><div><p className="text-sm font-semibold text-neutral-100">Open my event pass</p><p className="mt-1 text-xs text-neutral-500">Ready for your next event.</p></div><div className="shrink-0 rounded-xl bg-white p-2"><QRPlaceholder size={72} /></div></button><div className="mt-4 flex items-center gap-2 text-xs text-neutral-500"><ShieldCheck className="h-4 w-4 text-emerald-400" /> Attendance and merit updates are recorded automatically.</div></section>
        </div>
      </main>
    </div>
  );
}
