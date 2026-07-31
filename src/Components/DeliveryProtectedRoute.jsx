import { Navigate } from "react-router-dom";

export default function DeliveryProtectedRoute({ children }) {
  const isDeliveryLoggedIn = localStorage.getItem("deliveryLogin") === "true";
  const userRole = localStorage.getItem("userRole");

  if (!isDeliveryLoggedIn || userRole !== "delivery") {
    return <Navigate to="/delivery-login" replace />;
  }

  return children;
}