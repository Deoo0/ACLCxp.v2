import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import LoadingScreen from "../components/feedback/LoadingScreen";
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

  const loginDebounceRef = useRef<number | null>(null);
  const unauthorizedDebounceRef = useRef<number | null>(null);
  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        loginDebounceRef.current = setTimeout(() => setShowLoginModal(true), 150);
      } else {
        setShowLoginModal(false);
        if (loginDebounceRef.current) clearTimeout(loginDebounceRef.current);
      }
      if (roles && !roles.includes(user?.role ?? "")) {
        unauthorizedDebounceRef.current = setTimeout(() => setShowUnauthorizedModal(true), 150);
      } else {
        setShowUnauthorizedModal(false);
        if (unauthorizedDebounceRef.current) clearTimeout(unauthorizedDebounceRef.current);
      }
    } else {
      setShowLoginModal(false);
      setShowUnauthorizedModal(false);
      if (loginDebounceRef.current) clearTimeout(loginDebounceRef.current);
      if (unauthorizedDebounceRef.current) clearTimeout(unauthorizedDebounceRef.current);
    }
    return () => {
      if (loginDebounceRef.current) clearTimeout(loginDebounceRef.current);
      if (unauthorizedDebounceRef.current) clearTimeout(unauthorizedDebounceRef.current);
    };
  }, [isLoading, isAuthenticated, roles, user]);

  if (isLoading) {
    return <LoadingScreen/>;
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

  if (roles && !roles.includes(user?.role ?? "")) {
    const redirectPath =
      user?.role === "ADMIN"
        ? "/admin"
        : "/dashboard";

    return (
      <>
        {showUnauthorizedModal && (
          <Modal
            title="Unauthorized"
            message="You do not have permission to access this page."
            actionLabel="Go Back"
            actionTo={redirectPath}
            onClose={() => navigate(redirectPath, { replace: true })}
          />
        )}
      </>
    );
  }

  return <>{children}</>;
}