import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import PublicNavBar from "../navigation/PublicNavBar";
import UserNavBar from "../navigation/UserNavBar";
import Footer from "../navigation/Footer";
import SupportChat from "../ui/SupportChat";



export default function PublicLayout() {
    const { user } = useAuth();
    
    const isUserRole =
    user?.role === "STUDENT";
    
    if (user?.role === "ADMIN") {
        return <Navigate to="/admin" replace />;
    } 
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