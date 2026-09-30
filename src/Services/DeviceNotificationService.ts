import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { NotificationService } from './NotificationService';

// Safe dynamic accessor for expo-notifications to prevent crashing in Expo Go on Android SDK 53+
let NotificationsModule: typeof import('expo-notifications') | null = null;

try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  NotificationsModule = require('expo-notifications');
} catch (err: any) {
  console.log('[Notifications] expo-notifications native module not available (e.g. Expo Go Android SDK 53+):', err?.message);
}

// Configure how notifications should behave when app is in foreground
if (NotificationsModule && NotificationsModule.setNotificationHandler) {
  try {
    NotificationsModule.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
        priority: NotificationsModule?.AndroidNotificationPriority?.MAX,
      }),
    });
  } catch (err) {
    console.log('[Notifications] Could not set notification handler:', err);
  }
}

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
    if (!NotificationsModule) {
      console.log('[Notifications] Skipping device notification init (Running in Expo Go or module unavailable)');
      return null;
    }

    try {
      // 1. Android Notification Channel setup
      if (Platform.OS === 'android' && NotificationsModule.setNotificationChannelAsync) {
        await NotificationsModule.setNotificationChannelAsync('default', {
          name: 'General Notifications',
          description: 'CRM updates, leads, payments, and system notifications',
          importance: NotificationsModule.AndroidImportance?.MAX ?? 5,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#10b981',
          sound: 'default',
          enableVibrate: true,
          showBadge: true,
          lockscreenVisibility: NotificationsModule.AndroidNotificationVisibility?.PUBLIC ?? 1,
          audioAttributes: {
            usage: NotificationsModule.AndroidAudioUsage?.NOTIFICATION ?? 5,
            contentType: NotificationsModule.AndroidAudioContentType?.SONIFICATION ?? 4,
          },
        });
      }

      // 2. Request Permissions
      if (NotificationsModule.getPermissionsAsync && NotificationsModule.requestPermissionsAsync) {
        const { status: existingStatus } = await NotificationsModule.getPermissionsAsync();
        let finalStatus = existingStatus;

        if (existingStatus !== 'granted') {
          const { status } = await NotificationsModule.requestPermissionsAsync({
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
      }

      // 3. Get Project ID and Push Token
      const projectId =
        Constants?.expoConfig?.extra?.eas?.projectId ??
        Constants?.easConfig?.projectId;

      let token: string | null = null;
      if (NotificationsModule.getExpoPushTokenAsync) {
        try {
          const tokenData = await NotificationsModule.getExpoPushTokenAsync(
            projectId ? { projectId } : undefined
          );
          token = tokenData.data;
        } catch (tokenErr) {
          console.log('[Notifications] Could not get Expo Push Token, attempting device token fallback:', tokenErr);
          try {
            if (NotificationsModule.getDevicePushTokenAsync) {
              const deviceTokenData = await NotificationsModule.getDevicePushTokenAsync();
              token = deviceTokenData.data;
            }
          } catch { }
        }
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
      console.warn('[Notifications] Initialization notice:', err?.message);
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
    if (!NotificationsModule || !NotificationsModule.scheduleNotificationAsync) {
      return null;
    }

    try {
      const notificationId = await NotificationsModule.scheduleNotificationAsync({
        content: {
          title,
          body,
          data,
          sound: sound ? 'default' : undefined,
          priority: NotificationsModule.AndroidNotificationPriority?.MAX,
          vibrate: [0, 250, 250, 250],
        },
        trigger: {
          channelId: 'default',
        },
      });
      return notificationId;
    } catch (err: any) {
      console.warn('[Notifications] Failed to schedule notification:', err?.message);
      return null;
    }
  },

  /**
   * Listen for user tapping a notification in the notification bar / lock screen
   */
  addNotificationResponseListener: (
    onNotificationClick: (response: any) => void
  ) => {
    if (NotificationsModule && NotificationsModule.addNotificationResponseReceivedListener) {
      return NotificationsModule.addNotificationResponseReceivedListener(onNotificationClick);
    }
    return { remove: () => {} };
  },
};
