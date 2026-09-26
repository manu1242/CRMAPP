/**
 * API URL resolution — two modes only:
 *
 *  • Development (__DEV__ = true):  reads EXPO_PUBLIC_API_URL from .env
 *  • Production  (__DEV__ = false): reads EXPO_PUBLIC_API_URL baked in by EAS build
 *                                   (always "https://uproptech.com" via eas.json)
 *
 * No OTA / remote-config / GitHub fetching. No AsyncStorage caching.
 */

/** Fallback — should never be needed since eas.json always sets the env var. */
const PRODUCTION_API_URL = 'https://uproptech.com';

export interface RemoteConfig {
  apiUrl: string;
}

// In-memory resolved URL, set once at startup
let resolvedApiUrl: string | null = null;

/**
 * Returns the resolved API URL.
 * Safe to call at any point — initRemoteConfig() is synchronous.
 */
export function getApiUrl(): string {
  return resolvedApiUrl ?? process.env.EXPO_PUBLIC_API_URL ?? PRODUCTION_API_URL;
}

/**
 * Initializes the API URL.
 *
 * Call this ONCE at app startup before any API calls are made.
 * Returns a resolved Promise immediately (fully synchronous logic).
 *
 * Both dev and production use the same env key EXPO_PUBLIC_API_URL.
 * In dev it comes from .env; in production EAS injects it at build time via eas.json.
 */
export function initRemoteConfig(): Promise<void> {
  // Both modes resolve the same env key — EAS guarantees its value in production.
  resolvedApiUrl = process.env.EXPO_PUBLIC_API_URL ?? PRODUCTION_API_URL;

  return Promise.resolve();
}
