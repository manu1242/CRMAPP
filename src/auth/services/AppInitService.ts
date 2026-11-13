import { TokenStorage } from '../storage/TokenStorage';
import { Platform } from 'react-native';
import { initRemoteConfig, getApiUrl } from '../../api/remoteConfig';
import { resetSessionExpiryGuard } from '../../api/sessionExpiryGuard';
 
// ─── Result type returned by AppInitService.run() ────────────────────────────
export interface AppInitResult {
  hasInternet: boolean;
  backendReachable: boolean;
  maintenance: boolean;
  tokenFound: boolean;
  sessionInitialized: boolean;
}
 
// ─── Callback type for live status updates to the splash screen ───────────────
export type OnStatusUpdate = (message: string) => void;
 
// ─── Timeout helper ───────────────────────────────────────────────────────────
function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Timeout')), ms);
    promise.then(
      (val) => { clearTimeout(timer); resolve(val); },
      (err) => { clearTimeout(timer); reject(err); }
    );
  });
}
 
// ─── Step 1: Internet connectivity check ─────────────────────────────────────
// Uses navigator.onLine on web to bypass browser CORS constraints, falls back to Google's 204 endpoint on native
async function checkInternet(): Promise<boolean> {
  if (Platform.OS === 'web') {
    return typeof navigator !== 'undefined' ? navigator.onLine : true;
  }
  try {
    const res = await withTimeout(
      fetch('https://clients3.google.com/generate_204', { method: 'HEAD' }),
      3500
    );
    return res.status === 204 || res.ok;
  } catch {
    return false;
  }
}
 
// ─── Step 2 & 3: Backend health check + maintenance mode ────────────────────
interface HealthResult {
  reachable: boolean;
  maintenance: boolean;
}
 
async function checkBackend(): Promise<HealthResult> {
  try {
    const baseUrl = getApiUrl().replace(/\/$/, '');
    const res = await withTimeout(
      fetch(`${baseUrl}/api/health`, { method: 'GET' }),
      3500
    );

    if (res.ok) {
      // Check for maintenance mode via JSON body or response header
      let maintenance = res.headers.get('x-maintenance-mode') === 'true';
      try {
        const data = await res.json() as Record<string, any>;
        if (data?.maintenance === true || data?.status === 'maintenance') {
          maintenance = true;
        }
      } catch { /* non-JSON body is fine */ }
      return { reachable: true, maintenance };
    }

    // Any HTTP response (4xx, 5xx) means the server IS reachable
    return { reachable: true, maintenance: false };
  } catch {
    // Network error / timeout
    return { reachable: false, maintenance: false };
  }
}
 
// ─── Step 4: Load JWT token from secure storage ───────────────────────────────
async function loadToken(): Promise<boolean> {
  try {
    const token = await TokenStorage.getAccessToken();
    return !!token;
  } catch {
    return false;
  }
}
 
// ─── Step 5: Initialize session from stored token ────────────────────────────
async function initSession(): Promise<boolean> {
  try {
    resetSessionExpiryGuard();
    const { useAuthStore } = await import('../store/authStore');
    await useAuthStore.getState().initializeSession();
    return useAuthStore.getState().isAuthenticated;
  } catch {
    return false;
  }
}
 
// ─── Public API ───────────────────────────────────────────────────────────────
export const AppInitService = {
  /**
   * Runs boot initialization steps concurrently for fast app startup (<3.5s).
   * Prevents app from stalling on the splash screen or blocking Google Play automated reviews.
   */
  run: async (onStatus: OnStatusUpdate): Promise<AppInitResult> => {
    // ── 0. Resolve API URL ────────────────────────────────────────────────────
    onStatus('Starting up…');
    await initRemoteConfig().catch((err) => {
      console.warn('initRemoteConfig failed in AppInitService:', err);
    });

    // ── 1, 2, 3: Run Internet & Backend checks concurrently ───────────────────
    onStatus('Checking connection…');
    const [internetSettled, backendSettled, tokenFound] = await Promise.all([
      checkInternet().catch(() => false),
      checkBackend().catch(() => ({ reachable: false, maintenance: false })),
      loadToken().catch(() => false),
    ]);

    const hasInternet = internetSettled;
    const { reachable: backendReachable, maintenance } = backendSettled;

    // If completely offline and no stored token, show offline screen
    if (!hasInternet && !tokenFound) {
      return {
        hasInternet: false,
        backendReachable: false,
        maintenance: false,
        tokenFound: false,
        sessionInitialized: false,
      };
    }

    if (maintenance) {
      return {
        hasInternet: true,
        backendReachable: true,
        maintenance: true,
        tokenFound: false,
        sessionInitialized: false,
      };
    }

    // ── 4 & 5. Initialize session (only if token exists) ─────────────────────
    let sessionInitialized = false;
    if (tokenFound) {
      onStatus('Restoring your session…');
      sessionInitialized = await initSession();
    }

    return {
      hasInternet: true,
      backendReachable: true,
      maintenance: false,
      tokenFound,
      sessionInitialized,
    };
  },
};
