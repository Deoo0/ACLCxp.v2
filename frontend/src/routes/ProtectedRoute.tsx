import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Modal from "./Modal";

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) setShowModal(true);
  }, [isLoading, isAuthenticated]);

  if (isLoading) return null;

  if (!isAuthenticated) return (
    <>
      {showModal && (
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

  return <>{children}</>;
}