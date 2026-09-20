import StudentSeasonGate from "./StudentSeasonGate";
import { useEffect, useState } from "react";
import UserNavBar from "../navigation/UserNavBar";
import BottomNavigation from "../navigation/BottomNavigation";
import PageTransition from "../feedback/PageTransition";
import StudentPass from "../dashboard/StudentPass";
import {
  HiHome,
  HiCalendar,
  HiAcademicCap,
  HiUser,
  HiQrcode,
} from "react-icons/hi";
export default function UserLayout() {
  const [qrOpen, setQrOpen] = useState(false);
  useEffect(() => {
    const open = () => setQrOpen(true);
    window.addEventListener("aclcxp:open-student-qr", open);
    return () => window.removeEventListener("aclcxp:open-student-qr", open);
  }, []);
  return (
    <StudentSeasonGate><div className="min-h-screen bg-neutral-950">
      <div className="h-[74px] lg:h-20">
        <UserNavBar />
      </div>
      <main className="pb-28 lg:pb-8">
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
      <StudentPass open={qrOpen} onClose={() => setQrOpen(false)} />
    </div></StudentSeasonGate>
  );
}
