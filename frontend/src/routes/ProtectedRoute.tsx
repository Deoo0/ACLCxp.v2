import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Modal from "../components/ui/Modal";

interface ProtectedRouteProps {
  children: React.ReactNode;
  roles?: string[];
}

export default function ProtectedRoute({ children, roles }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, user } = useAuth();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showUnauthorizedModal, setShowUnauthorizedModal] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        setShowLoginModal(true);
      } else if (roles && !roles.includes(user?.role ?? "")) {
        setShowUnauthorizedModal(true);
      }
    }
  }, [isLoading, isAuthenticated, roles, user]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        Loading...
      </div>
    );
  }

  if (!isAuthenticated) return (
    <>
      {showLoginModal && (
        <Modal
          title="Login required"
          message="You need to log in first to access this page."
          actionLabel="Go to Login"
          actionTo="/login"
          onClose={() => navigate("/login", { replace: true })}
        />
      )}
    </>
  );

  if (roles && !roles.includes(user?.role ?? "")) return (
    <>
      {showUnauthorizedModal && (
        <Modal
          title="Unauthorized"
          message="You do not have permission to access this page."
          actionLabel="Back to Dashboard"
          actionTo="/dashboard"
          onClose={() => navigate("/dashboard", { replace: true })}
        />
      )}
    </>
  );

  return <>{children}</>;
}