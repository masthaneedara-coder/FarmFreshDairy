import { createContext, useContext, useEffect, useState } from "react";
import {
  getCustomer,
  logoutCustomer,
  logoutAdmin,
  logoutDelivery,
} from "../config/auth";

const AuthSessionContext = createContext();

export function AuthSessionProvider({ children }) {
  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedCustomer = getCustomer();

    if (storedCustomer) {
      setCustomer(storedCustomer);
    }

    setLoading(false);
  }, []);

  const login = (customerData) => {
    setCustomer(customerData);
  };

  const logout = () => {
    logoutCustomer();
    logoutAdmin();
    logoutDelivery();
    setCustomer(null);
  };

  return (
    <AuthSessionContext.Provider
      value={{
        customer,
        loading,
        login,
        logout,
      }}
    >
      {children}
    </AuthSessionContext.Provider>
  );
}

export function useAuthSession() {
  return useContext(AuthSessionContext);
}