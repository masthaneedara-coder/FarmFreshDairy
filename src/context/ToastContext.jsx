import {
  createContext,
  useContext,
  useState,
  useCallback,
} from "react";

const ToastContext = createContext(null);

export function ToastProvider({ children }) {

  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((prev) =>
      prev.filter((toast) => toast.id !== id)
    );
  }, []);

  const showToast = useCallback(
    ({
      type = "info",
      title,
      message,
      duration = 5000,
    }) => {

      const id =
        Date.now() +
        Math.random().toString(36);

      const toast = {
        id,
        type,
        title,
        message,
      };

      setToasts((prev) => [
        ...prev,
        toast,
      ]);

      setTimeout(() => {
        removeToast(id);
      }, duration);

    },
    [removeToast]
  );

  const value = {
    toasts,
    showToast,
    removeToast,
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
    </ToastContext.Provider>
  );
}

export function useToast() {

  const context =
    useContext(ToastContext);

  if (!context) {
    throw new Error(
      "useToast must be used inside ToastProvider"
    );
  }

  return context;
}