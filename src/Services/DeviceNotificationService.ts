import { Platform } from 'react-native';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NotificationService } from './NotificationService';

const CACHED_PUSH_TOKEN_KEY = 'crm_cached_expo_push_token';
const EAS_PROJECT_ID = '77acddcb-ef08-4cb4-8559-6a9b7b986d36';

// Safe dynamic accessor for expo-notifications
let NotificationsModule: typeof import('expo-notifications') | null = null;

try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  NotificationsModule = require('expo-notifications');
} catch (err: any) {
  console.log('[Notifications] expo-notifications native module not available:', err?.message);
}

// 1. Configure OS-level foreground notification behavior (alert banner, sound, badge)
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
    console.log('[Notifications] Could not set foreground notification handler:', err);
  }
}

export interface LocalNotificationPayload {
  title: string;
  body: string;
  data?: Record<string, any>;
  sound?: boolean;
}

let activeToken: string | null = null;
let lastHandledResponseId: string | null = null;
let lastHandledResponseTime = 0;

export const DeviceNotificationService = {
  /**
   * Initialize Android high-importance channel, request permissions,
   * generate Expo Push Token, and register it with the backend.
   */
  init: async (): Promise<string | null> => {
    if (!NotificationsModule) {
      console.log('[Notifications] Skipping push initialization (module unavailable)');
      return null;
    }

    try {
      // 1. Setup Android 8.0+ High Importance Notification Channel
      if (Platform.OS === 'android' && NotificationsModule.setNotificationChannelAsync) {
        await NotificationsModule.setNotificationChannelAsync('default', {
          name: 'General Notifications',
          description: 'CRM updates, lead assignments, task reminders, and finance alerts',
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

      // 2. Request Android 13+ POST_NOTIFICATIONS & iOS notification permissions
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
          console.log('[Notifications] Push notification permission not granted by user');
          return null;
        }
      }

      // 3. Resolve Project ID and Generate Expo Push Token
      const projectId =
        Constants?.expoConfig?.extra?.eas?.projectId ??
        Constants?.easConfig?.projectId ??
        EAS_PROJECT_ID;

      let token: string | null = null;
      if (NotificationsModule.getExpoPushTokenAsync) {
        try {
          const tokenData = await NotificationsModule.getExpoPushTokenAsync(
            projectId ? { projectId } : undefined
          );
          token = tokenData.data;
        } catch (tokenErr) {
          console.log('[Notifications] Expo Push Token lookup fallback:', tokenErr);
          try {
            if (NotificationsModule.getDevicePushTokenAsync) {
              const deviceTokenData = await NotificationsModule.getDevicePushTokenAsync();
              token = deviceTokenData.data;
            }
          } catch { }
        }
      }

      if (!token) {
        console.warn('[Notifications] No push token generated');
        return null;
      }

      activeToken = token;
      await AsyncStorage.setItem(CACHED_PUSH_TOKEN_KEY, token);

      // 4. Register Push Token with CRM Backend
      const platformName = Platform.OS === 'ios' ? 'iOS' : 'Android';
      try {
        await NotificationService.saveDeviceToken(token, platformName);
        console.log('[Notifications] Registered push token with backend:', token);
      } catch (saveErr: any) {
        console.warn('[Notifications] Failed to sync push token with backend:', saveErr?.message);
      }

      return token;
    } catch (err: any) {
      console.warn('[Notifications] Initialization error:', err?.message);
      return null;
    }
  },

  /**
   * Unregister / deactivate push token on user logout
   */
  unregister: async (): Promise<void> => {
    try {
      const token = activeToken || (await AsyncStorage.getItem(CACHED_PUSH_TOKEN_KEY));
      if (token) {
        await NotificationService.unregisterDeviceToken(token);
        console.log('[Notifications] Unregistered push token on logout');
      }
    } catch (err: any) {
      console.warn('[Notifications] Failed to unregister push token:', err?.message);
    } finally {
      activeToken = null;
      await AsyncStorage.removeItem(CACHED_PUSH_TOKEN_KEY).catch(() => {});
    }
  },

  /**
   * Get the current active token
   */
  getActiveToken: (): string | null => activeToken,

  /**
   * Schedules a local notification banner
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
   * Centralized route resolver from notification payload
   */
  resolveNavigationRoute: (data?: Record<string, any>): string => {
    if (!data) return '/admin/AdminNotification';

    const type = (data.type || data.relatedEntityType || '').toString().toLowerCase();
    const entityId = data.relatedEntityId || data.leadId || data.taskId || data.bookingId || data.quotationId || data.invoiceId || data.paymentId;

    // 1. Leads
    if (type.includes('lead') || data.leadId) {
      if (entityId) {
        return `/admin/leads/${entityId}`;
      }
      return '/admin/leads';
    }

    // 2. Tasks / Follow-ups
    if (type.includes('task') || type.includes('followup') || data.taskId || data.followUpId) {
      return '/admin/Tasks';
    }

    // 3. Bookings
    if (type.includes('booking') || data.bookingId) {
      if (entityId) {
        return `/admin/SalesUnit/bookings/${entityId}`;
      }
      return '/admin/SalesUnit/bookings';
    }

    // 4. Quotations
    if (type.includes('quotation') || data.quotationId) {
      if (entityId) {
        return `/admin/SalesUnit/quotation/${entityId}`;
      }
      return '/admin/SalesUnit/quotation';
    }

    // 5. Invoices
    if (type.includes('invoice') || data.invoiceId) {
      if (entityId) {
        return `/admin/SalesUnit/invoice/${entityId}`;
      }
      return '/admin/SalesUnit/invoice';
    }

    // 6. Payments
    if (type.includes('payment') || data.paymentId) {
      return '/admin/SalesUnit/payments';
    }

    // 7. Properties
    if (type.includes('property') || data.propertyId) {
      return '/admin/properties';
    }

    // 8. Custom relative link if provided and valid
    if (typeof data.link === 'string' && data.link.startsWith('/admin/')) {
      return data.link;
    }

    // Default fallback
    return '/admin/AdminNotification';
  },

  /**
   * Sets up notification response listener (taps on lockscreen/tray) and
   * handles cold-start notification navigation if app was closed.
   */
  setupNotificationResponseHandler: (
    router: any,
    onForegroundReceive?: (notification: any) => void
  ) => {
    if (!NotificationsModule) {
      return { remove: () => {} };
    }

    const handleResponse = (response: any) => {
      if (!response || !response.notification) return;

      const identifier = response.notification.request?.identifier || '';
      const now = Date.now();

      // Guard against duplicate triggers within 1.5 seconds for the same notification
      if (identifier && identifier === lastHandledResponseId && now - lastHandledResponseTime < 1500) {
        return;
      }

      lastHandledResponseId = identifier;
      lastHandledResponseTime = now;

      const data = response.notification.request?.content?.data || {};
      const targetRoute = DeviceNotificationService.resolveNavigationRoute(data);

      console.log('[Notifications] Navigating from notification tap to:', targetRoute);
      try {
        router.push(targetRoute as any);
      } catch (navErr) {
        console.warn('[Notifications] Navigation failed:', navErr);
      }
    };

    // 1. Cold-start check: app opened from a killed state by tapping notification
    if (NotificationsModule.getLastNotificationResponseAsync) {
      NotificationsModule.getLastNotificationResponseAsync()
        .then((response) => {
          if (response) {
            console.log('[Notifications] Cold-start notification detected');
            // Small timeout to allow auth/navigation tree to finish mounting
            setTimeout(() => {
              handleResponse(response);
            }, 600);
          }
        })
        .catch((err) => {
          console.log('[Notifications] Error checking cold-start notification:', err);
        });
    }

    // 2. Foreground / background tap listener
    let responseSubscription: any = null;
    if (NotificationsModule.addNotificationResponseReceivedListener) {
      responseSubscription = NotificationsModule.addNotificationResponseReceivedListener(handleResponse);
    }

    // 3. Optional foreground notification received listener
    let receiveSubscription: any = null;
    if (onForegroundReceive && NotificationsModule.addNotificationReceivedListener) {
      receiveSubscription = NotificationsModule.addNotificationReceivedListener(onForegroundReceive);
    }

    return {
      remove: () => {
        if (responseSubscription?.remove) responseSubscription.remove();
        if (receiveSubscription?.remove) receiveSubscription.remove();
      },
    };
  },
};
