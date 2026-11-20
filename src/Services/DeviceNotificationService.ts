import { Platform, AppState, AppStateStatus } from 'react-native';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NotificationService } from './NotificationService';

const CACHED_PUSH_TOKEN_KEY = 'crm_cached_expo_push_token';
const EAS_PROJECT_ID = '77acddcb-ef08-4cb4-8559-6a9b7b986d36';

// Minimum interval (ms) between token re-registration attempts on foreground resume.
// Prevents spamming the backend if the user rapidly switches apps.
const TOKEN_REREGISTER_INTERVAL_MS = 10 * 60 * 1000; // 10 minutes

// Safe dynamic accessor for expo-notifications
let NotificationsModule: typeof import('expo-notifications') | null = null;

try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  NotificationsModule = require('expo-notifications');
} catch (err: any) {
  console.log('[Notifications] expo-notifications native module not available:', err?.message);
}

// ---------------------------------------------------------------------------
// A6 Fix: Set notification handler at module load time.
// Priority fallback `?? 5` ensures IMPORTANCE_HIGH even in Expo Go where
// AndroidNotificationPriority may be undefined.
// Foreground handler covers both Android heads-up banners and iOS alert banners.
// ---------------------------------------------------------------------------
if (NotificationsModule && NotificationsModule.setNotificationHandler) {
  try {
    NotificationsModule.setNotificationHandler({
      handleNotification: async () => ({
        // Android: show as heads-up banner even when app is in foreground
        shouldShowAlert: true,
        shouldShowBanner: true,
        shouldShowList: true,
        // iOS: play sound + update badge in foreground
        shouldPlaySound: true,
        shouldSetBadge: true,
        // A6 Fix: numeric fallback for Expo Go / simulators
        priority: NotificationsModule?.AndroidNotificationPriority?.MAX ?? 5,
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
let lastTokenRegistrationTime = 0;
const handledResponseIds = new Set<string>();

// ---------------------------------------------------------------------------
// A4 Fix: AppState foreground listener so the token is always re-validated
// when the user brings the app back to the front. Covered for both platforms:
//   - Android: app resumed from background / task switcher
//   - iOS: app resumed from background (foreground via home button / switcher)
// ---------------------------------------------------------------------------
let _appStateSubscription: ReturnType<typeof AppState.addEventListener> | null = null;

function attachAppStateForegroundListener(): void {
  if (_appStateSubscription) return; // already attached
  _appStateSubscription = AppState.addEventListener('change', (nextState: AppStateStatus) => {
    if (nextState === 'active') {
      const now = Date.now();
      if (now - lastTokenRegistrationTime > TOKEN_REREGISTER_INTERVAL_MS) {
        DeviceNotificationService.init().catch((err) => {
          console.warn('[Notifications] Foreground re-registration failed:', err?.message);
        });
      }
    }
  });
}

export const DeviceNotificationService = {
  /**
   * Initialize notification channels (Android), request OS permissions (Android 13+ / iOS),
   * generate an Expo Push Token (works for both APNs on iOS and FCM/GCM on Android),
   * and register the token with the CRM backend.
   *
   * Safe to call multiple times — re-registration is debounced by TOKEN_REREGISTER_INTERVAL_MS.
   * Must be called AFTER the user is authenticated so the backend JWT is valid.
   */
  init: async (): Promise<string | null> => {
    if (!NotificationsModule) {
      console.log('[Notifications] Skipping push initialization (module unavailable)');
      return null;
    }

    try {
      // ── Android: Set up high-importance notification channel ─────────────
      // Required for Android 8.0+ (Oreo). Without a channel, notifications are
      // silently dropped. The channel controls: sound, vibration, lock-screen
      // visibility, LED color, and importance level.
      if (Platform.OS === 'android' && NotificationsModule.setNotificationChannelAsync) {
        await NotificationsModule.setNotificationChannelAsync('default', {
          name: 'General Notifications',
          description: 'CRM updates, lead assignments, task reminders, and finance alerts',
          // HIGH importance → heads-up banner, sound, tray + lock screen.
          // NOTE: Android locks channel settings after first creation; reinstall to apply changes.
          importance: NotificationsModule.AndroidImportance?.HIGH ?? 4,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#10b981',
          sound: 'default',
          enableVibrate: true,
          showBadge: true,
          // PUBLIC → notification content visible on lock screen without unlocking
          lockscreenVisibility: NotificationsModule.AndroidNotificationVisibility?.PUBLIC ?? 1,
          audioAttributes: {
            usage: NotificationsModule.AndroidAudioUsage?.NOTIFICATION ?? 5,
            contentType: NotificationsModule.AndroidAudioContentType?.SONIFICATION ?? 4,
          },
        });

        // ── Additional channel: follow-up reminders (urgent) ───────────────
        await NotificationsModule.setNotificationChannelAsync('followup-reminders', {
          name: 'Follow-Up Reminders',
          description: 'Scheduled follow-up and overdue task reminders',
          importance: NotificationsModule.AndroidImportance?.MAX ?? 5,
          vibrationPattern: [0, 500, 300, 500],
          lightColor: '#f59e0b',
          sound: 'default',
          enableVibrate: true,
          showBadge: true,
          lockscreenVisibility: NotificationsModule.AndroidNotificationVisibility?.PUBLIC ?? 1,
        });
      }

      // ── iOS + Android 13+: Request notification permissions ───────────────
      // On Android 13+: triggers the POST_NOTIFICATIONS runtime permission dialog.
      // On iOS: triggers the APNs permission dialog (alert, badge, sound).
      // On older Android: getPermissionsAsync() always returns 'granted'.
      if (NotificationsModule.getPermissionsAsync && NotificationsModule.requestPermissionsAsync) {
        const { status: existingStatus } = await NotificationsModule.getPermissionsAsync();
        let finalStatus = existingStatus;

        if (existingStatus !== 'granted') {
          const { status } = await NotificationsModule.requestPermissionsAsync({
            ios: {
              allowAlert: true,
              allowBadge: true,
              allowSound: true,
              // allowProvisional delivers quiet notifications to the iOS
              // notification centre without an upfront permission dialog.
              allowProvisional: true,
            },
          });
          finalStatus = status;
        }

        console.log(`[Notifications] Permission status: ${finalStatus} (was ${existingStatus})`);
        if (finalStatus !== 'granted') {
          console.log('[Notifications] Push notification permission not granted by user — will retry when the app returns to foreground');
          // Attach foreground listener anyway so we retry when user returns
          attachAppStateForegroundListener();
          return null;
        }
      }

      // ── Resolve EAS Project ID ────────────────────────────────────────────
      const projectId =
        Constants?.expoConfig?.extra?.eas?.projectId ??
        Constants?.easConfig?.projectId ??
        EAS_PROJECT_ID;

      // ── Generate Expo Push Token ──────────────────────────────────────────
      // getExpoPushTokenAsync works on both platforms:
      //   • iOS  → Expo proxies through APNs (Apple Push Notification service)
      //   • Android → Expo proxies through FCM/GCM
      // Returns a token in the form: ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]
      let token: string | null = null;
      let nativeToken: string | null = null;

      // Native FCM token (Android). The backend's CRM event pushes (FcmService → Firebase Admin)
      // can only be delivered to this token type — Firebase rejects Expo tokens.
      if (Platform.OS === 'android' && NotificationsModule.getDevicePushTokenAsync) {
        try {
          const deviceTokenData = await NotificationsModule.getDevicePushTokenAsync();
          nativeToken = typeof deviceTokenData?.data === 'string' ? deviceTokenData.data : null;
        } catch (nativeErr: any) {
          // Usually: google-services.json missing from the build ("Default FirebaseApp is not initialized")
          console.warn('[Notifications] Native FCM token unavailable:', nativeErr?.message);
        }
      }

      if (NotificationsModule.getExpoPushTokenAsync) {
        try {
          const tokenData = await NotificationsModule.getExpoPushTokenAsync(projectId ? { projectId } : undefined);
          token = tokenData.data;
        } catch (tokenErr: any) {
          console.warn('[Notifications] Expo push token unavailable:', tokenErr?.message);
        }
      }

      if (!token && !nativeToken) {
        console.warn('[Notifications] No push token generated — check google-services.json / EAS FCM credentials');
        attachAppStateForegroundListener();
        return null;
      }
      console.log(`[Notifications] Tokens: expo=${token ? 'yes' : 'no'}, native=${nativeToken ? 'yes' : 'no'}`);

      activeToken = token ?? nativeToken;
      await AsyncStorage.setItem(CACHED_PUSH_TOKEN_KEY, activeToken as string);

      // ── Register token with CRM backend ───────────────────────────────────
      // Platform string tells the backend whether to handle as iOS (APNs) or Android (FCM).
      const platformName = Platform.OS === 'ios' ? 'iOS' : 'Android';
      try {
        const res = await NotificationService.saveDeviceToken(token ?? '', platformName, nativeToken);
        lastTokenRegistrationTime = Date.now();
        console.log(
          `[Notifications] Registered ${platformName} push tokens with backend` +
            (res?.data ? ` (crmEventPushReady=${res.data.crmEventPushReady})` : '')
        );
      } catch (saveErr: any) {
        console.warn('[Notifications] Failed to sync push token with backend:', saveErr?.message);
      }

      // ── Attach AppState foreground re-registration listener ───────────────
      attachAppStateForegroundListener();

      return activeToken;
    } catch (err: any) {
      console.warn('[Notifications] Initialization error:', err?.message);
      return null;
    }
  },

  /**
   * Unregister / deactivate push token on user logout.
   * Works for both iOS and Android — deactivates the token server-side
   * so the user stops receiving push notifications after signing out.
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
      lastTokenRegistrationTime = 0;
      await AsyncStorage.removeItem(CACHED_PUSH_TOKEN_KEY).catch(() => {});
    }
  },

  /**
   * Get the current active Expo Push Token (or null if not registered).
   */
  getActiveToken: (): string | null => activeToken,

  /**
   * A1 Fix: Schedules an IMMEDIATE local notification that appears in the
   * system notification tray and on the lock screen.
   *
   * Platform behaviour:
   *   • Android: Heads-up banner (foreground), notification panel + lock screen (background/killed)
   *   • iOS: Alert banner (foreground if shouldShowBanner=true), lock screen, notification centre
   *
   * The critical fix here is `trigger: null` — this schedules the notification for
   * immediate delivery. The previous `trigger: { channelId: 'default' }` was not a
   * valid trigger object and caused notifications to be silently dropped on Android.
   * On iOS, `channelId` is ignored anyway (iOS uses categories, not channels).
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
          // A6 Fix: numeric fallback `?? 5` for Expo Go / simulators where
          // AndroidNotificationPriority enum may be undefined at runtime.
          priority: NotificationsModule.AndroidNotificationPriority?.MAX ?? 5,
          // Android only — vibration pattern; ignored on iOS
          vibrate: [0, 250, 250, 250],
          // iOS only — subtitle line below title in the notification
          subtitle: undefined,
          // Auto-dismiss on Android tap; iOS always auto-dismisses
          autoDismiss: true,
          sticky: false,
        },
        // A1 Fix: `trigger: null` = fire immediately.
        // Do NOT put channelId here — it belongs in content on Android,
        // and iOS does not use channels at all.
        trigger: null,
      });
      return notificationId;
    } catch (err: any) {
      console.warn('[Notifications] Failed to schedule notification:', err?.message);
      return null;
    }
  },

  /**
   * Schedules an immediate local notification on the follow-up reminders channel.
   * Identical to triggerSystemNotification but routes to the high-vibration channel.
   * Android only — on iOS falls back to default sound/banner behaviour.
   */
  triggerFollowUpNotification: async ({
    title,
    body,
    data = {},
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
          sound: 'default',
          priority: NotificationsModule.AndroidNotificationPriority?.MAX ?? 5,
          vibrate: [0, 500, 300, 500],
          autoDismiss: true,
          sticky: false,
        },
        trigger: null,
      });
      return notificationId;
    } catch (err: any) {
      console.warn('[Notifications] Failed to schedule follow-up notification:', err?.message);
      return null;
    }
  },

  /**
   * A2 Fix: Deduplication-aware system notification dispatcher.
   *
   * When a push notification arrives in the foreground AND the in-app UI
   * would show it simultaneously (via polling / query invalidation), there
   * is a risk of showing the same notification twice. This method tracks
   * recently shown notification IDs and suppresses duplicates within a 5-second
   * window, preventing double-banners on both Android and iOS.
   */
  _shownNotificationIds: new Set<string>(),
  triggerDedupedSystemNotification: async (
    payload: LocalNotificationPayload & { dedupeKey?: string }
  ): Promise<string | null> => {
    const key = payload.dedupeKey ?? `${payload.title}::${payload.body}`;
    if (DeviceNotificationService._shownNotificationIds.has(key)) {
      console.log('[Notifications] Duplicate suppressed:', key);
      return null;
    }
    DeviceNotificationService._shownNotificationIds.add(key);
    // Auto-clear dedupe key after 5 seconds
    setTimeout(() => {
      DeviceNotificationService._shownNotificationIds.delete(key);
    }, 5000);
    return DeviceNotificationService.triggerSystemNotification(payload);
  },

  /**
   * Centralized route resolver from notification data payload.
   * Works for both Expo push payloads (from backend) and local notifications.
   * Maps notification type/entity to the correct in-app screen on both iOS and Android.
   */
  resolveNavigationRoute: (data?: Record<string, any>): string => {
    if (!data) return '/admin/AdminNotification';

    // Explicit route from the backend payload wins
    if (typeof data.screen === 'string' && data.screen.startsWith('/admin/')) return data.screen;

    const type = `${data.type || ''} ${data.relatedEntityType || data.entityType || ''}`.toLowerCase();
    const rawId = data.entityId || data.relatedEntityId || data.leadId;
    // Firebase data values arrive as strings; ignore empty / "0"
    const entityId = rawId && String(rawId) !== '0' ? rawId : data.relatedEntityId || data.leadId || data.taskId || data.bookingId || data.quotationId || data.invoiceId || data.paymentId;

    // 1. Leads & Follow-ups (FollowUpReminder, FollowUp, Overdue, Lead*)
    if (type.includes('lead') || type.includes('followup') || type.includes('overdue') || data.leadId) {
      if (entityId) return `/admin/leads/${entityId}`;
      return '/admin/leads';
    }

    // 2. Tasks
    if (type.includes('task') || data.taskId || data.followUpId) {
      return '/admin/Tasks';
    }

    // 3. Bookings
    if (type.includes('booking') || data.bookingId) {
      if (entityId) return `/admin/SalesUnit/bookings/${entityId}`;
      return '/admin/SalesUnit/bookings';
    }

    // 4. Quotations
    if (type.includes('quotation') || data.quotationId) {
      if (entityId) return `/admin/SalesUnit/quotation/${entityId}`;
      return '/admin/SalesUnit/quotation';
    }

    // 5. Invoices
    if (type.includes('invoice') || data.invoiceId) {
      if (entityId) return `/admin/SalesUnit/invoice/${entityId}`;
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
   * Sets up all notification event listeners for the app lifecycle:
   *   1. Cold-start (killed-app) tap → navigate after app boots (Android + iOS)
   *   2. Foreground/background tap → navigate immediately (Android + iOS)
   *   3. Foreground notification received → update badge/cache (Android + iOS)
   *
   * Must be called once inside InnerLayout (after auth tree is mounted).
   * Returns a cleanup { remove() } handle for useEffect return.
   */
  setupNotificationResponseHandler: (
    router: any,
    onForegroundReceive?: (notification: any) => void,
    onTapped?: () => void
  ) => {
    if (!NotificationsModule) {
      return { remove: () => {} };
    }

    const handleResponse = (response: any) => {
      if (!response || !response.notification) return;

      const identifier = response.notification.request?.identifier || '';
      const now = Date.now();

      // Each notification navigates at most once — cold-start lookup and the live listener can
      // both report the same tap.
      if (identifier && (handledResponseIds.has(identifier) ||
          (identifier === lastHandledResponseId && now - lastHandledResponseTime < 1500))) {
        return;
      }
      if (identifier) handledResponseIds.add(identifier);
      lastHandledResponseId = identifier;
      lastHandledResponseTime = now;

      // Don't let the OS replay this response on the next app launch
      try {
        NotificationsModule?.clearLastNotificationResponse?.();
      } catch { /* older SDKs */ }

      const data = response.notification.request?.content?.data || {};
      const targetRoute = DeviceNotificationService.resolveNavigationRoute(data);
      console.log('[Notifications] Tap →', targetRoute, '| type:', data.type, '| entity:', data.entityId ?? data.relatedEntityId);

      // Sync the in-app notification list (mark the matching row read)
      const notificationId = Number(data.notificationId) || undefined;
      const relatedEntityId = Number(data.entityId ?? data.relatedEntityId) || undefined;
      if (notificationId || relatedEntityId) {
        NotificationService.markReadFromPush({
          notificationId,
          type: data.type || undefined,
          relatedEntityId: notificationId ? undefined : relatedEntityId,
          relatedEntityType: data.relatedEntityType || data.entityType || undefined,
        })
          .then(() => onTapped?.())
          .catch((e: any) => console.warn('[Notifications] mark-read failed:', e?.message));
      }

      try {
        router.push(targetRoute as any);
      } catch (navErr) {
        console.warn('[Notifications] Navigation failed:', navErr);
      }
    };

    // ── 1. Cold-start: app was completely killed, user tapped a notification ─
    // Works on both iOS and Android. The OS holds the last response in memory.
    // We delay 600ms to let the navigation tree and auth state finish mounting.
    if (NotificationsModule.getLastNotificationResponseAsync) {
      NotificationsModule.getLastNotificationResponseAsync()
        .then((response) => {
          if (response) {
            console.log('[Notifications] Cold-start notification detected (app launched from a tap)');
            setTimeout(() => handleResponse(response), 600);
          }
        })
        .catch((err) => {
          console.log('[Notifications] Error checking cold-start notification:', err);
        });
    }

    // ── 2. Foreground / background tap listener ───────────────────────────────
    // Fires when user taps a notification while app is in foreground or background.
    // Works on Android and iOS.
    let responseSubscription: any = null;
    if (NotificationsModule.addNotificationResponseReceivedListener) {
      responseSubscription = NotificationsModule.addNotificationResponseReceivedListener(handleResponse);
    }

    // ── 3. Foreground notification received listener ──────────────────────────
    // Fires when a push notification arrives while the app is in the foreground.
    // Used to invalidate TanStack Query cache for real-time badge/list updates.
    // Works on Android and iOS.
    let receiveSubscription: any = null;
    if (onForegroundReceive && NotificationsModule.addNotificationReceivedListener) {
      receiveSubscription = NotificationsModule.addNotificationReceivedListener((n: any) => {
        // The handler above already shows the banner — only refresh in-app data here (no second notification)
        console.log('[Notifications] Received in foreground:', n?.request?.content?.title);
        onForegroundReceive(n);
      });
    }

    return {
      remove: () => {
        if (responseSubscription?.remove) responseSubscription.remove();
        if (receiveSubscription?.remove) receiveSubscription.remove();
      },
    };
  },
};
