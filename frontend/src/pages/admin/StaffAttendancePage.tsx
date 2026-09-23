import { useAuth } from "../../context/AuthContext";
import DailyAttendance from "../../components/admin/DailyAttendance";
import { button } from "../../components/admin/ConsoleUI";
export default function StaffAttendancePage() {
  const { logout } = useAuth();
  return <main className="min-h-screen bg-neutral-950 px-4 py-8 text-neutral-200"><div className="mx-auto max-w-5xl space-y-6"><header className="flex items-center justify-between gap-4"><div><p className="text-sm text-amber-300">Staff workspace</p><h1 className="mt-2 text-2xl font-semibold text-white">Attendance approval</h1></div><button className={button} onClick={() => void logout()}>Sign out</button></header><DailyAttendance /></div></main>;
}
