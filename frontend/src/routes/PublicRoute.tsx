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
  } else {
    return <Navigate to="/" replace />;
  }

}

  return <>{children}</>;
}