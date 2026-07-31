import { Navigate } from "react-router-dom";
import { isAdminLoggedIn } from "../config/auth";

export default function AdminProtectedRoute({ children }) {
  return isAdminLoggedIn()
    ? children
    : <Navigate to="/admin-login" replace />;
}