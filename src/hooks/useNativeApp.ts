import { useBackButton } from '@/hooks/useBackButton';
import { useStatusBar } from '@/hooks/useStatusBar';
import { usePushNotifications } from '@/hooks/usePushNotifications';

const useNativeApp = () => {
  useBackButton();
  useStatusBar();
  usePushNotifications();
};

export default useNativeApp;
