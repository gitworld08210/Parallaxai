import { useEffect, useState } from "react";
import { Capacitor } from "@capacitor/core";
import {
  PushNotifications,
  type PluginListenerHandle,
} from "@capacitor/push-notifications";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthProvider";

export const usePushNotifications = () => {
  const { user } = useAuth();
  const userId = user?.uid;
  const [token, setToken] = useState<string | null>(null);
  const [permissionGranted, setPermissionGranted] = useState(false);

  useEffect(() => {
    if (!userId || !Capacitor.isNativePlatform()) return;

    let disposed = false;
    const listeners: PluginListenerHandle[] = [];

    const initialize = async () => {
      try {
        listeners.push(
          await PushNotifications.addListener("registration", async (registration) => {
            if (disposed) return;
            setToken(registration.value);
            try {
              await setDoc(
                doc(db, "push_tokens", userId, "tokens", registration.value),
                {
                  token: registration.value,
                  platform: Capacitor.getPlatform(),
                  updated_at: serverTimestamp(),
                },
                { merge: true }
              );
            } catch (error) {
              console.warn("Push token persistence failed:", error);
            }
          })
        );

        listeners.push(
          await PushNotifications.addListener("registrationError", (error) => {
            console.warn("Push notification registration failed:", error);
          })
        );

        listeners.push(
          await PushNotifications.addListener("pushNotificationReceived", (notification) => {
            console.info("Push notification received:", notification.id);
          })
        );

        listeners.push(
          await PushNotifications.addListener("pushNotificationActionPerformed", (action) => {
            console.info("Push notification action:", action.notification.id);
          })
        );

        const permission = await PushNotifications.requestPermissions();
        if (disposed || permission.receive !== "granted") return;

        setPermissionGranted(true);
        await PushNotifications.register();
      } catch (error) {
        // Push setup must never block or crash application startup. This also
        // handles local builds that intentionally omit google-services.json.
        console.warn("Push notification setup unavailable:", error);
      }
    };

    void initialize();

    return () => {
      disposed = true;
      void Promise.allSettled(listeners.map((listener) => listener.remove()));
    };
  }, [userId]);

  return { token, permissionGranted };
};
