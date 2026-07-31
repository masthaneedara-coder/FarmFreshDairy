import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

import {
  DEFAULT_NOTIFICATION_PREFERENCES,
} from "../config/notificationPreferences";

const STORAGE_KEY = "farmFreshNotificationPreferences";

const NotificationPreferenceContext = createContext(null);

export function NotificationPreferenceProvider({
  children,
}) {
  const [preferences, setPreferences] = useState(
    DEFAULT_NOTIFICATION_PREFERENCES
  );

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);

      if (saved) {
        setPreferences(JSON.parse(saved));
      }
    } catch (error) {
      console.error(error);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(preferences)
    );
  }, [preferences]);

  const updatePreference = (key, value) => {
    setPreferences((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const resetPreferences = () => {
    setPreferences(DEFAULT_NOTIFICATION_PREFERENCES);
  };

  const value = {
    preferences,
    updatePreference,
    resetPreferences,
  };

  return (
    <NotificationPreferenceContext.Provider value={value}>
      {children}
    </NotificationPreferenceContext.Provider>
  );
}

export function useNotificationPreferences() {
  const context = useContext(
    NotificationPreferenceContext
  );

  if (!context) {
    throw new Error(
      "useNotificationPreferences must be used inside NotificationPreferenceProvider"
    );
  }

  return context;
}