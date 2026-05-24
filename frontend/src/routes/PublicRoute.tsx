import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Modal from "../components/ui/Modal";

export default function PublicRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && isAuthenticated) setShowModal(true);
  }, [isLoading, isAuthenticated]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        Loading...
      </div>
    );
  }

  if (isAuthenticated) return (
    <>
      {showModal && (
        <Modal
          title="Already logged in"
          message="You are already logged in."
          actionLabel="Go to Dashboard"
          actionTo="/dashboard"
          onClose={() => navigate("/dashboard", { replace: true })}
        />
      )}
    </>
  );

  return <>{children}</>;
}