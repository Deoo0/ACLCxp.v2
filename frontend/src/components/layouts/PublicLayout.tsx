import { Outlet } from "react-router-dom";
import PublicHeader from "../navigation/PublicHeader";
import Footer from "../navigation/Footer";
import SupportChat from "../ui/SupportChat";

export default function PublicLayout() {
    return (
        <>
            <PublicHeader />

            <main>
                <Outlet />
            </main>

            <Footer />
            <SupportChat />
        </>
    );
}