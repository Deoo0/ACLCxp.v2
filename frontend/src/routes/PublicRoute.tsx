import { useAuth } from "../context/AuthContext";
import LoadingScreen from "../components/feedback/LoadingScreen";
import { Navigate } from "react-router-dom";

export default function PublicRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, user } = useAuth();
;
  if (isLoading) {
    return <LoadingScreen />;
  }

  if (isAuthenticated) {
  if (user?.role === "ADMIN") {
    return <Navigate to="/admin" replace />;
  } else if (user && ["STAFF", "ORGANIZER"].includes(user.role)) {
    return <Navigate to="/staff/attendance" replace />;
  } else {
    // Auth state is set before LoginPage's navigate call completes. Sending a
    // signed-in student to the public landing page mounted its white surface
    // and overrode the intended dashboard redirect.
    return <Navigate to="/dashboard" replace />;
  }

}

  return <>{children}</>;
}
