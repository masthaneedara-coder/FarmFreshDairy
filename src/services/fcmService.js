import { Capacitor } from "@capacitor/core";
import { FirebaseMessaging } from "@capacitor-firebase/messaging";

const API_BASE_URL = "https://farmfreshdairy.onrender.com/api";

export const initializeFCM = async () => {
  if (!Capacitor.isNativePlatform()) {
    console.log("[FCM] Running on web - FCM initialization skipped.");
    return null;
  }

  try {
    let permission = await FirebaseMessaging.checkPermissions();

    if (permission.receive !== "granted") {
      permission = await FirebaseMessaging.requestPermissions();
    }

    if (permission.receive !== "granted") {
      console.warn("[FCM] Notification permission was not granted.");
      return null;
    }

    const result = await FirebaseMessaging.getToken();

    console.log("[FCM] Device token received");

    const sessionRaw = localStorage.getItem("supabase_session");

    if (!sessionRaw) {
      console.warn("[FCM] No Supabase session found.");
      return result.token;
    }

    const session = JSON.parse(sessionRaw);
    const accessToken = session?.access_token;

    if (!accessToken) {
      console.warn("[FCM] No Supabase access token found.");
      return result.token;
    }

    const response = await fetch(
      `${API_BASE_URL}/customer-devices/register`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          deviceToken: result.token,
          platform: Capacitor.getPlatform(),
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("[FCM] Device registration failed:", data);
      return result.token;
    }

    console.log("[FCM] Device registered successfully");

    return result.token;
  } catch (error) {
    console.error("[FCM] Initialization failed:", error);
    return null;
  }
};