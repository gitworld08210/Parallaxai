import { useEffect, useState } from "react";
import { Capacitor } from "@capacitor/core";
import { PushNotifications } from "@capacitor/push-notifications";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthProvider";

export const usePushNotifications = () => {
  const { user } = useAuth();
  const [token, setToken] = useState<string | null>(null);
  const [permissionGranted, setPermissionGranted] = useState(false);

  useEffect(() => {
    if (!user || !Capacitor.isNativePlatform()) return;

    const register = async () => {
      const permission = await PushNotifications.requestPermissions();
      if (permission.receive === "granted") {
        setPermissionGranted(true);
        await PushNotifications.register();
      }
    };

    const registrationListener = PushNotifications.addListener("registration", async (t) => {
      setToken(t.value);
      if (user) {
        await setDoc(doc(db, "push_tokens", user.uid, "tokens", t.value), {
          token: t.value,
          platform: Capacitor.getPlatform(),
          created_at: serverTimestamp(),
        });
      }
    });

    const notificationListener = PushNotifications.addListener("pushNotificationReceived", (notification) => {
      console.log("Push notification received:", notification);
    });

    const actionListener = PushNotifications.addListener("pushNotificationActionPerformed", (action) => {
      console.log("Push notification action:", action);
    });

    register();

    return () => {
      registrationListener.then(l => l.remove());
      notificationListener.then(l => l.remove());
      actionListener.then(l => l.remove());
    };
  }, [user]);

  return { token, permissionGranted };
};
