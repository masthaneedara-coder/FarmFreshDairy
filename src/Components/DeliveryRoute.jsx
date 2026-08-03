import { Navigate, useLocation } from "react-router-dom";
import { isDelivery } from "../config/auth";

export default function DeliveryRoute({ children }) {
  const location = useLocation();

  if (!isDelivery()) {
    localStorage.setItem(
      "redirectAfterLogin",
      location.pathname
    );

    return <Navigate to="/delivery-login" replace />;
  }

  return children;
}