import { Navigate, useLocation } from "react-router-dom";
import { isAdmin } from "../config/auth";

export default function AdminRoute({ children }) {
  const location = useLocation();

  if (!isAdmin()) {
    localStorage.setItem(
      "redirectAfterLogin",
      location.pathname
    );

    return <Navigate to="/auth" replace />;
  }

  return children;
}