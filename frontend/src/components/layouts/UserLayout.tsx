import { Outlet } from "react-router-dom";
import UserHeader from "../navigation/UserHeader";
import UserNavBar from "../navigation/UserNavBar";

export default function UserLayout() {
  return (
    <>
      <div className="min-h-screen bg-gray-50 pb-20">
        <UserHeader />

        <main className="px-4 pt-5 max-w-4xl mx-auto">
          <Outlet />
        </main>

        <UserNavBar />
      </div>
    </>
  );
}