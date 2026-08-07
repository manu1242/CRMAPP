import { TokenStorage } from '../storage/TokenStorage';
import { axiosInstance } from '../../api/axios';
import { Platform } from 'react-native';
import { initRemoteConfig } from '../../api/remoteConfig';
 
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
  try {
    // Try a lightweight HEAD on the login endpoint — avoids needing a dedicated /health route
    // Falls back to GET /api/health if HEAD is rejected
    const res = await withTimeout(
      axiosInstance.get('/api/health', { timeout: 6000 }),
      7000
    );
 
    // Check for maintenance mode via JSON body or response header
    const data = res.data as Record<string, any> | null;
    const maintenanceHeader = res.headers?.['x-maintenance-mode'];
    const maintenanceBody = data?.maintenance === true || data?.status === 'maintenance';
    const maintenance = maintenanceHeader === 'true' || maintenanceBody;
 
    return { reachable: true, maintenance };
  } catch (err: any) {
    // If we get a 404 / 401 / 405, the backend IS reachable — /api/health just doesn't exist
    const status: number | undefined = err?.response?.status;
    if (status !== undefined && status !== 0) {
      // Any HTTP response (even 4xx) means the server is up
      return { reachable: true, maintenance: false };
    }
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
  run: async (onStatus: OnStatusUpdate, forceRefresh = false): Promise<AppInitResult> => {
    // ── 0. Fetch latest remote configuration ──────────────────────────────────
    onStatus('Connecting to server…');
    await initRemoteConfig(forceRefresh).catch((err) => {
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
