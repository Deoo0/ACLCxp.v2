import { Outlet } from "react-router-dom";
import UserNavBar from "../navigation/UserNavBar";
import Footer from "../navigation/Footer";  

export default function UserLayout() {
  return (
    <>
      <div className="min-h-screen bg-gray-50 pb-10">
        <div className="h-18 border-b bg-[#1E1E1E]">
          <UserNavBar/>
        </div>

        <main className="px-4 pt-5 max-w-4xl mx-auto">
          <Outlet />
        </main>

      </div>
      <Footer />
    </>
  );
}