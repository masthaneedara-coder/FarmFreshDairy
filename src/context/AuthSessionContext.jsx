import { createContext, useContext, useEffect, useState } from "react";

import {
  getCustomer,
  setCustomerLogin,
  logoutCustomer,
  logoutAdmin,
  logoutDelivery,
} from "../config/auth";

const AuthSessionContext = createContext();

export function AuthSessionProvider({ children }) {
  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);

  // Restore customer session when the app starts
  useEffect(() => {
    try {
      const storedCustomer = getCustomer();

      console.log("AuthSessionProvider - stored customer:", storedCustomer);

      if (storedCustomer?.id) {
        setCustomer(storedCustomer);
      } else {
        setCustomer(null);
      }
    } catch (error) {
      console.error("Unable to restore customer session:", error);
      setCustomer(null);
    } finally {
      setLoading(false);
    }
  }, []);

  // Login
  const login = (customerData) => {
    if (!customerData?.id) {
      console.error("Invalid customer login data:", customerData);
      return;
    }

    // Save customer to localStorage
    setCustomerLogin(customerData);

    // Update React state
    setCustomer(customerData);

    console.log("Customer session saved:", customerData);
  };

  // Logout
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