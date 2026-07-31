import { Navigate, useLocation } from "react-router-dom";
import { useAuthSession } from "../context/AuthSessionContext";

export default function ProtectedRoute({ children }) {
  const location = useLocation();

  const {
    customer,
    loading,
  } = useAuthSession();

  if (loading) {
    return (
      <div className="min-h-screen flex justify-center items-center">
        <h2 className="text-xl font-semibold text-green-700">
          Checking your session...
        </h2>
      </div>
    );
  }

  if (!customer) {
    localStorage.setItem(
      "redirectAfterLogin",
      location.pathname
    );

    return <Navigate to="/auth" replace />;
  }

  return children;
}