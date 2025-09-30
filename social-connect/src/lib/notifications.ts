import { getMessaging, getToken, onMessage } from "firebase/messaging";
import { auth } from "./firebase";

// 1️⃣ Request permission and get FCM token
export const requestNotificationPermission = async () => {
  const messaging = getMessaging();
  try {
    // Ask user to allow notifications
    await Notification.requestPermission();

    // Get device token
    const token = await getToken(messaging, {
      vapidKey: "YOUR_VAPID_KEY_HERE", // Use the VAPID key from Firebase
    });

    console.log("✅ FCM Token:", token);
    return token;

  } catch (err) {
    console.error("❌ Permission denied", err);
    return null;
  }
};

// 2️⃣ Listen for incoming notifications while app is open
export const listenNotifications = (callback: (payload: any) => void) => {
  const messaging = getMessaging();
  onMessage(messaging, (payload) => {
    console.log("📩 Message received: ", payload);
    callback(payload);
  });
};
