import { useEffect } from "react";
import { StatusBar, Style } from "@capacitor/status-bar";
import { isNativePlatform, isAndroid } from "@/lib/capacitor";

export const useStatusBar = () => {
  useEffect(() => {
    if (!isNativePlatform()) return;

    const configure = async () => {
      try {
        await StatusBar.setStyle({ style: Style.Light });
        if (isAndroid()) {
          await StatusBar.setBackgroundColor({ color: "#08070f" });
        }
      } catch (error) {
        console.warn("Status bar configuration unavailable:", error);
      }
    };

    void configure();
  }, []);
};
