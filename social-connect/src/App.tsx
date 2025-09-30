import React, { useEffect } from "react";
import { IonApp, isPlatform } from "@ionic/react";
import AppNavigator from "./navigation/AppNavigator";

import { requestNotificationPermission, listenNotifications } from "./lib/notifications";
import { PushNotifications } from "@capacitor/push-notifications";

const App: React.FC = () => {
  useEffect(() => {
    const initNotifications = async () => {
      if (isPlatform("hybrid")) {
        // Capacitor mobile notifications
        PushNotifications.register();

        PushNotifications.addListener("registration", (token) => {
          console.log("Push token:", token.value);
        });

        PushNotifications.addListener("pushNotificationReceived", (notification) => {
          alert(`Notification: ${notification.title} - ${notification.body}`);
        });

      } else {
        // Web notifications (Firebase Messaging)
        try {
          const token = await requestNotificationPermission();
          console.log("Device token for web notifications:", token);

          listenNotifications((payload) => {
            alert(`Notification: ${payload.notification?.title} - ${payload.notification?.body}`);
          });
        } catch (err) {
          console.warn("Web notifications not supported:", err);
        }
      }
    };

    initNotifications();
  }, []);

  return <IonApp><AppNavigator /></IonApp>;
};

export default App;
