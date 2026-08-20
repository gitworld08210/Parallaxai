import { useEffect } from 'react';
import { StatusBar, Style } from '@capacitor/status-bar';
import { isNativePlatform, isAndroid } from '@/lib/capacitor';

export const useStatusBar = () => {
  useEffect(() => {
    if (!isNativePlatform()) return;

    StatusBar.setStyle({ style: Style.Dark });
    
    // setBackgroundColor is Android-only
    if (isAndroid()) {
      StatusBar.setBackgroundColor({ color: '#08070f' });
    }
  }, []);
};
