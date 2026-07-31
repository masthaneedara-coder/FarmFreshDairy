import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { Toaster } from "react-hot-toast";

import App from "./App";
import "./index.css";

import { NotificationProvider } from "./context/NotificationContext";
import { NotificationPreferenceProvider } from "./context/NotificationPreferenceContext";
import { ToastProvider } from "./context/ToastContext";
import { SubscriptionProvider } from "./context/SubscriptionContext";
import { AuthSessionProvider } from "./context/AuthSessionContext";

// import ToastContainer from "./components/ToastContainer";

ReactDOM.createRoot(
  document.getElementById("root")
).render(
  <React.StrictMode>
    <BrowserRouter>
   <AuthSessionProvider>

        <NotificationPreferenceProvider>

          <ToastProvider>

            <NotificationProvider>

              <SubscriptionProvider>

                <App />

                <Toaster
                  position="top-right"
                  reverseOrder={false}
                  toastOptions={{
                    duration: 3000,
                    style: {
                      borderRadius: "12px",
                      background: "#fff",
                      color: "#333",
                    },
                  }}
                />

              </SubscriptionProvider>

            </NotificationProvider>

          </ToastProvider>

        </NotificationPreferenceProvider>

      </AuthSessionProvider>   

    </BrowserRouter>
  </React.StrictMode>
);