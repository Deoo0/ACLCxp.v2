import { Outlet } from "react-router-dom";
import UserNavBar from "../navigation/UserNavBar";

export default function UserLayout() {
  return (
    <>
      <div className="min-h-screen bg-gray-50 pb-20">
        <UserNavBar />

        <main>
          <Outlet />
        </main>

      </div>
    </>
  );
}