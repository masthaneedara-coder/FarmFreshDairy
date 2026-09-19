import { Capacitor } from "@capacitor/core";
import { FirebaseMessaging } from "@capacitor-firebase/messaging";

export const initializeFCM = async () => {
  // Only run FCM initialization inside the native Android/iOS app.
  if (!Capacitor.isNativePlatform()) {
    console.log("[FCM] Running on web - FCM initialization skipped.");
    return null;
  }

  try {
    // Check current notification permission
    let permission = await FirebaseMessaging.checkPermissions();

    // Ask the user if permission has not been granted
    if (permission.receive !== "granted") {
      permission = await FirebaseMessaging.requestPermissions();
    }

    if (permission.receive !== "granted") {
      console.warn("[FCM] Notification permission was not granted.");
      return null;
    }

    // Get the FCM device token
    const result = await FirebaseMessaging.getToken();

    console.log("[FCM] Device token:", result.token);

    return result.token;
  } catch (error) {
    console.error("[FCM] Initialization failed:", error);
    return null;
  }
};