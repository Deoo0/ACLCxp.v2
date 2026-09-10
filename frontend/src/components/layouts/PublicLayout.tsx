import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import PublicNavBar from "../navigation/PublicNavBar";
import Footer from "../navigation/Footer";
import SupportChat from "../ui/SupportChat";



export default function PublicLayout() {
    const { user } = useAuth();
    
    if (user?.role === "ADMIN") {
        return <Navigate to="/admin" replace />;
    }

    // Student navigation belongs exclusively to the protected student shell.
    // This prevents QR/profile controls from appearing on public and auth pages.
    if (user) {
        return <Navigate to="/dashboard" replace />;
    }

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
