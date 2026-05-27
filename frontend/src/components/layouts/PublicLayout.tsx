import { Outlet } from "react-router-dom";
import PublicNavBar from "../navigation/PublicNavBar";
import Footer from "../navigation/Footer";
import SupportChat from "../ui/SupportChat";

export default function PublicLayout() {
    return (
        <>
            <PublicNavBar />

            <main>
                <Outlet />
            </main>

            <Footer />
            <SupportChat />
        </>
    );
}