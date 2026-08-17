import { useState } from "react";
import { Outlet } from "react-router-dom";
import UserNavBar from "../navigation/UserNavBar";
import BottomNavigation from "../navigation/BottomNavigation";
import { useAuth } from "../../context/AuthContext";
import { HiHome, HiChartBar, HiAcademicCap, HiUser, HiQrcode } from "react-icons/hi";

export default function UserLayout() {
  const { user } = useAuth();
  const [qrOpen, setQrOpen] = useState(false);

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
    <div
      className="fixed inset-0 z-100 flex flex-col"
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
        <div className="w-28 h-28 rounded-full overflow-hidden border-4 border-white shadow-md shrink-0">
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
  return (
    <>
      <div className="min-h-screen w-full bg-gray-50">
        <div className="h-18 border-b bg-[#1E1E1E]">
          <UserNavBar />
        </div>

        <main className="w-full px-0 pt-0 pb-24 sm:pb-0">
          <Outlet />
        </main>

        <BottomNavigation
          items={[
            { label: "Dashboard", path: "/dashboard", icon: HiHome },
            { label: "Merit", path: "/merit", icon: HiAcademicCap },
            { label: "Stats", path: "/stats", icon: HiChartBar },
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