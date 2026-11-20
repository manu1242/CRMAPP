/**
 * Extends app.json (Expo passes it in as `config`).
 *
 * Push notifications on Android need Firebase Cloud Messaging:
 *   1. Put the Firebase project's `google-services.json` in the project root (same folder as this file).
 *      It must be the same Firebase project as the backend's `firebase-credentials.json`.
 *   2. Upload the FCM V1 service-account key to EAS: `eas credentials` → Android → Push Notifications.
 * The file is only referenced when present so builds without it still succeed (push just stays disabled).
 */
const fs = require('fs');
const path = require('path');

const GOOGLE_SERVICES = './google-services.json';
const NOTIFICATION_ICON = './assets/images/notification-icon.png'; // white silhouette on transparent

module.exports = ({ config }) => {
  const hasGoogleServices = fs.existsSync(path.join(__dirname, GOOGLE_SERVICES));
  if (!hasGoogleServices) {
    console.warn('[app.config] google-services.json not found — Android push notifications will not work in this build.');
  }

  const plugins = (config.plugins || []).map((p) => {
    const name = Array.isArray(p) ? p[0] : p;
    if (name !== 'expo-notifications') return p;
    const opts = Array.isArray(p) ? p[1] || {} : {};
    return [
      'expo-notifications',
      {
        ...opts,
        // Android status-bar icon must be monochrome; a coloured logo renders as a white square
        icon: NOTIFICATION_ICON,
        color: opts.color || '#10b981',
        defaultChannel: 'default',
      },
    ];
  });

  return {
    ...config,
    plugins,
    android: {
      ...config.android,
      ...(hasGoogleServices ? { googleServicesFile: GOOGLE_SERVICES } : {}),
    },
  };
};
