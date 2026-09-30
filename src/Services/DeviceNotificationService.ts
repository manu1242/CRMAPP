import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { NotificationService } from './NotificationService';

// Configure how notifications should behave when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    priority: Notifications.AndroidNotificationPriority.MAX,
  }),
});

export interface LocalNotificationPayload {
  title: string;
  body: string;
  data?: Record<string, any>;
  sound?: boolean;
}

export const DeviceNotificationService = {
  /**
   * Initialize notification channels and register for device push token
   */
  init: async (): Promise<string | null> => {
    try {
      // 1. Android Notification Channel setup
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'General Notifications',
          description: 'CRM updates, leads, payments, and system notifications',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#10b981',
          sound: 'default',
          enableVibrate: true,
          showBadge: true,
          lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
        });
      }

      // 2. Request Permissions
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync({
          ios: {
            allowAlert: true,
            allowBadge: true,
            allowSound: true,
          },
        });
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.log('[Notifications] Permission not granted by user');
        return null;
      }

      // 3. Get Project ID and Push Token
      const projectId =
        Constants?.expoConfig?.extra?.eas?.projectId ??
        Constants?.easConfig?.projectId;

      let token: string | null = null;
      try {
        const tokenData = await Notifications.getExpoPushTokenAsync(
          projectId ? { projectId } : undefined
        );
        token = tokenData.data;
      } catch (tokenErr) {
        console.log('[Notifications] Could not get Expo Push Token, fallback to device token:', tokenErr);
        try {
          const deviceTokenData = await Notifications.getDevicePushTokenAsync();
          token = deviceTokenData.data;
        } catch { }
      }

      // 4. Save device token with backend API
      if (token) {
        console.log('[Notifications] Device Push Token:', token);
        NotificationService.saveDeviceToken(token).catch((err) => {
          console.warn('[Notifications] Failed to sync device token with backend:', err?.message);
        });
      }

      return token;
    } catch (err: any) {
      console.warn('[Notifications] Initialization error:', err?.message);
      return null;
    }
  },

  /**
   * Trigger an immediate notification banner on Android & iOS notification drawer & lock screen
   */
  triggerSystemNotification: async ({
    title,
    body,
    data = {},
    sound = true,
  }: LocalNotificationPayload): Promise<string | null> => {
    try {
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data,
          sound: sound ? 'default' : undefined,
          priority: Notifications.AndroidNotificationPriority.MAX,
          vibrate: [0, 250, 250, 250],
        },
        trigger: null, // trigger immediately
      });
      return notificationId;
    } catch (err: any) {
      console.warn('[Notifications] Failed to schedule local notification:', err?.message);
      return null;
    }
  },

  /**
   * Listen for user tapping a notification in the notification bar / lock screen
   */
  addNotificationResponseListener: (
    onNotificationClick: (response: Notifications.NotificationResponse) => void
  ) => {
    return Notifications.addNotificationResponseReceivedListener(onNotificationClick);
  },
};
