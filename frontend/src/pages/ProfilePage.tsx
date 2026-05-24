import { useRef, useState } from "react";
import AuthenticatedLayout from "../components/layouts/AuthenticatedLayout";
import { useAuth } from "../context/AuthContext";

const YEAR_LABELS: Record<number, string> = {
  1: "1st Year", 2: "2nd Year", 3: "3rd Year", 4: "4th Year",
};

const ROLE_LABELS: Record<string, string> = {
  STUDENT: "Student",
  FACILITATOR: "Facilitator",
  ORGANIZER: "Event Organizer",
  HOUSE_LEADER: "House Leader",
  ADMIN: "Administrator",
};

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

export default function ProfilePage() {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [localPhoto, setLocalPhoto] = useState<string | null>(null);
  const [qrOpen, setQrOpen] = useState(false);

  if (!user) return null;

  const initials =
    `${user.first_name?.[0] ?? ""}${user.last_name?.[0] ?? ""}`.toUpperCase();
  const photoSrc = localPhoto ?? (user.profile_photo || null);
  const houseColor = user.house_color ?? "#2E308E";

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setLocalPhoto(reader.result as string);
    reader.readAsDataURL(file);
  };

  return (
    <AuthenticatedLayout>
      <div className="flex flex-col gap-4 pb-6">

        {/* Avatar + Name */}
        <div className="flex flex-col items-center pt-4 pb-2">
          <div className="relative group">
            <div className="w-28 h-28 rounded-full overflow-hidden border-4 border-white shadow-md">
              {photoSrc ? (
                <img src={photoSrc} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <div
                  className="w-full h-full flex items-center justify-center text-white text-3xl font-bold"
                  style={{ backgroundColor: houseColor }}
                >
                  {initials}
                </div>
              )}
            </div>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 active:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1"
              aria-label="Change photo"
            >
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                  d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span className="text-white text-[10px] font-semibold">Edit</span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handlePhotoChange}
            />
          </div>

          <h1 className="mt-3 text-lg font-bold text-gray-900">{user.full_name}</h1>
          <p className="text-xs text-gray-400 mt-0.5">{user.student_id}</p>

          {/* Role badge — always navy text, never house color */}
          <span className="mt-2 text-xs font-medium px-3 py-0.5 rounded-full bg-[#2E308E]/10 text-[#2E308E]">
            {ROLE_LABELS[user.role] ?? user.role}
          </span>
        </div>

        {/* House Card — tinted bg, dark text */}
        <div
          className="rounded-xl px-4 py-3 flex items-center gap-3"
          style={{ backgroundColor: `${houseColor}18` }}
        >
          <div
            className="w-2.5 h-2.5 rounded-full flex-shrink-0"
            style={{ backgroundColor: houseColor }}
          />
          <div>
            <p className="text-xs text-gray-400">House</p>
            <p className="text-sm font-semibold text-gray-900">
              {user.house_name ?? "Unassigned"}
            </p>
          </div>
        </div>

        {/* Info Card */}
        <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
          <InfoRow label="Student ID" value={user.student_id} />
          <InfoRow label="Email"      value={user.email}      border />
          <InfoRow label="Program"    value={user.program}    border />
          <InfoRow
            label="Year Level"
            value={YEAR_LABELS[user.year_level] ?? `Year ${user.year_level}`}
            border
          />
        </div>

        {/* QR Card */}
        <div className="bg-white border border-gray-100 rounded-xl p-4 flex flex-col items-center gap-3">
          <div className="flex items-center justify-between w-full">
            <p className="text-sm font-semibold text-gray-900">My QR Code</p>
            <span className="text-[10px] bg-gray-100 text-gray-400 px-2 py-0.5 rounded-full">
              Attendance scanning
            </span>
          </div>

          <button
            onClick={() => setQrOpen(true)}
            className="rounded-xl overflow-hidden bg-white border border-gray-100 p-2 hover:bg-gray-50 transition-colors"
            aria-label="Open QR code fullscreen"
          >
            <QRPlaceholder size={128} />
          </button>

          <p className="text-xs text-gray-400 text-center">
            Tap to open fullscreen for scanning
          </p>
        </div>

      </div>

      {qrOpen && (
        <QRModal
          name={user.full_name}
          studentId={user.student_id}
          photo={photoSrc}
          initials={initials}
          houseColor={houseColor}
          houseName={user.house_name}
          onClose={() => setQrOpen(false)}
        />
      )}
    </AuthenticatedLayout>
  );
}

function InfoRow({ label, value, border }: { label: string; value: string; border?: boolean }) {
  return (
    <div className={`flex justify-between items-center px-4 py-3 ${border ? "border-t border-gray-50" : ""}`}>
      <p className="text-xs text-gray-400">{label}</p>
      <p className="text-sm font-medium text-gray-900 text-right max-w-[60%] truncate">{value}</p>
    </div>
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
    <div
      className="fixed inset-0 z-[100] flex flex-col"
      style={{
        background: `linear-gradient(to top, #ffffff 0%, #ffffff 20%, ${houseColor} 85%, color-mix(in srgb, ${houseColor} 85%, #000000) 100%)`,
      }}
    >
      {/* Top bar */}
      <div className="flex items-center justify-between px-5 py-4">
        <p className="text-sm font-semibold text-white">Student QR</p>
        <button
          onClick={onClose}
          className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 transition-colors flex items-center justify-center"
          aria-label="Close"
        >
          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 flex flex-col items-center justify-center px-8 gap-7">

        {/* Avatar */}
        <div className="w-28 h-28 rounded-full overflow-hidden border-4 border-white shadow-md flex-shrink-0">
          {photo ? (
            <img src={photo} alt={name} className="w-full h-full object-cover" />
          ) : (
            <div
              className="w-full h-full flex items-center justify-center text-white text-3xl font-bold"
              style={{ backgroundColor: houseColor }}
            >
              {initials}
            </div>
          )}
        </div>

        {/* Name + USN + House */}
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900">{name}</h2>
          <p className="text-sm text-gray-500 mt-1 tracking-widest font-mono">{studentId}</p>
          {houseName && (
            <div className="flex items-center justify-center gap-1.5 mt-2">
              <div
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: houseColor }}
              />
              <p className="text-xs text-gray-500 font-medium">{houseName}</p>
            </div>
          )}
        </div>

        {/* QR */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <QRPlaceholder size={220} />
        </div>

        <p className="text-xs text-gray-400 text-center">
          Show this to your facilitator during events
        </p>
      </div>
      
      {/* Bottom brand */}
      <div className="py-5 flex justify-center">
        {/* Option B — pill with primary/accent bg */}
        <div className="px-4 py-1.5 rounded-full bg-[#2E308E]">
          <p className="text-xs font-bold tracking-widest uppercase text-white">
            ACLC<span className="text-[#D91B22]">xp</span>
          </p>
        </div>
      </div>
    </div>
  );
}