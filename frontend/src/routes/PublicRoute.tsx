import { useAuth } from "../context/AuthContext";
import LoadingScreen from "../components/feedback/LoadingScreen";
import { Navigate } from "react-router-dom";

export default function PublicRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
;
  if (isLoading) {
    return <LoadingScreen />;
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}