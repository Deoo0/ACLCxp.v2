import type { ReactNode } from "react";
import AppHeader from "./AppHeader";
import StudentBottomNav from "./StudentBottomNav";

type Props = {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  activeNav?: string;
};

export default function AuthenticatedLayout({ children }: Props) {
  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <AppHeader />

      <main className="px-4 pt-5 max-w-2xl mx-auto">
        {children}
      </main>

      <StudentBottomNav />
    </div>
  );
}