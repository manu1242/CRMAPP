import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Remote configuration fetched from a fixed public URL on every app start.
 * Update the JSON at CONFIG_URL to change the API URL without rebuilding the APK.
 *
 * The config JSON shape:
 * {
 *   "apiUrl": "https://xyz789.trycloudflare.com"
 * }
 */
const CONFIG_URL = 'https://raw.githubusercontent.com/manu1242/CRMAPP/main/config.json';
const CACHE_KEY = '@remote_config_v1';
const FETCH_TIMEOUT_MS = 5000; // 5 second timeout to not block app start

export interface RemoteConfig {
  apiUrl: string;
}

// In-memory resolved URL, set once at startup
let resolvedApiUrl: string | null = null;

/**
 * Returns the currently resolved API URL.
 * Falls back to the hard-coded env var if remote config hasn't loaded yet.
 */
export function getApiUrl(): string {
  return resolvedApiUrl ?? process.env.EXPO_PUBLIC_API_URL ?? 'https://api.crmapp.local/v1';
}

/**
 * Sets the resolved API URL (used by remoteConfig to apply the fetched value).
 */
export function setApiUrl(url: string): void {
  resolvedApiUrl = url;
}

/**
 * Load cached config synchronously from AsyncStorage.
 * This is used as an immediate fallback before the network fetch completes.
 */
async function loadCachedConfig(): Promise<RemoteConfig | null> {
  try {
    const cached = await AsyncStorage.getItem(CACHE_KEY);
    if (cached) {
      return JSON.parse(cached) as RemoteConfig;
    }
  } catch {
    // Silently ignore cache errors
  }
  return null;
}

/**
 * Save config to AsyncStorage for next startup cache.
 */
async function saveConfigToCache(config: RemoteConfig): Promise<void> {
  try {
    await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(config));
  } catch {
    // Silently ignore cache errors
  }
}

async function fetchRemoteConfig(): Promise<RemoteConfig | null> {
  try {
    // Append a unique timestamp query parameter to bypass GitHub Raw CDN caching
    const response = await axios.get<RemoteConfig>(`${CONFIG_URL}?t=${Date.now()}`, {
      timeout: FETCH_TIMEOUT_MS,
      headers: { 'Cache-Control': 'no-cache' },
    });

    const data = response.data;
    if (data && typeof data.apiUrl === 'string' && data.apiUrl.startsWith('http')) {
      return data;
    }
  } catch {
    // Network failure, timeout, etc. — will fall through to cache/env fallback
  }
  return null;
}

/**
 * Initializes the remote config system.
 *
 * Strategy:
 * 1. Immediately apply the cached config (so the app starts fast).
 * 2. Fetch the latest config in the background.
 * 3. If the fetch succeeds, update the in-memory URL and cache for next time.
 *
 * Call this ONCE at app startup before any API calls are made.
 */
export async function initRemoteConfig(): Promise<void> {
  // Step 1: Apply cached config immediately for a fast boot
  const cached = await loadCachedConfig();
  if (cached) {
    setApiUrl(cached.apiUrl);
  }

  // Step 2: Fetch latest config from remote
  const fresh = await fetchRemoteConfig();

  if (fresh) {
    // Step 3: Update in-memory URL and persist for next startup
    setApiUrl(fresh.apiUrl);
    await saveConfigToCache(fresh);
  } else if (!cached) {
    // No cache and no network — fall back to build-time env var
    const fallbackUrl = process.env.EXPO_PUBLIC_API_URL ?? 'https://api.crmapp.local/v1';
    setApiUrl(fallbackUrl);
  }
}
