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
      5000
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
  // IMPORTANT: Use plain fetch() — NOT axiosInstance — so this request bypasses
  // the auth response interceptor. Using axiosInstance here would trigger
  // triggerSessionExpired() if the /api/health endpoint returns 401 (unauthenticated),
  // which sets isHandlingSessionExpiry=true and silently swallows the 401 that
  // initSession() later gets from profileApi.getCurrentProfile(), leaving
  // isAuthenticated=true with a stale/invalid token.
  try {
    const baseUrl = getApiUrl().replace(/\/$/, '');
    const res = await withTimeout(
      fetch(`${baseUrl}/api/health`, { method: 'GET' }),
      7000
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
    // Network error / timeout → backend is truly down
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
    // Reset the session expiry guard BEFORE calling initializeSession().
    // The /api/health check above (even via plain fetch) or any prior request
    // could have set isHandlingSessionExpiry=true. If it's still true when
    // profileApi.getCurrentProfile() returns 401, triggerSessionExpired() would
    // silently early-return, leaving isAuthenticated=true with an invalid token.
    resetSessionExpiryGuard();

    // Dynamically import to avoid circular dependency at module load time
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
   * Runs all boot initialization steps sequentially.
   * Calls `onStatus(message)` before each step so the splash screen can show live feedback.
   * Returns a structured AppInitResult for routing decisions.
   */
  run: async (onStatus: OnStatusUpdate): Promise<AppInitResult> => {
    // ── 0. Resolve API URL ────────────────────────────────────────────────────
    onStatus('Connecting to server…');
    await initRemoteConfig().catch((err) => {
      console.warn('initRemoteConfig failed in AppInitService:', err);
    });

    // ── 1. Internet ──────────────────────────────────────────────────────────
    onStatus('Checking connection…');
    const hasInternet = await checkInternet();

    // ── 2 & 3. Backend + Maintenance ─────────────────────────────────────────
    onStatus('Connecting to server…');
    const { reachable: backendReachable, maintenance } = await checkBackend();

    if (!backendReachable) {
      return {
        hasInternet, // If backend is unreachable, use the internet check to determine if the device is offline or the server is down
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

    // ── 4. Load token ─────────────────────────────────────────────────────────
    onStatus('Loading your profile…');
    const tokenFound = await loadToken();

    // ── 5. Initialize session (only if token exists) ───────────────────────────
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
