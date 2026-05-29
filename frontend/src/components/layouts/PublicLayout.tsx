import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import PublicNavBar from "../navigation/PublicNavBar";
import UserNavBar from "../navigation/UserNavBar";
import Footer from "../navigation/Footer";
import SupportChat from "../ui/SupportChat";

const { user } = useAuth();


export default function PublicLayout() {
    
    const isUserRole =
    user?.role === "STUDENT" ||
    user?.role === "FACILITATOR";
    
    if (user?.role === "ADMIN") {
        return <Navigate to="/admin" replace />;
    } else if (isUserRole) {
        return (
            <>
                {isUserRole
                    ? <UserNavBar />
                    : <PublicNavBar />
                }

                <main>
                    <Outlet />
                </main>

                <Footer />
                <SupportChat />
            </>
        );
    }
}