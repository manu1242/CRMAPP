import { AppState, AppStateStatus } from 'react-native';
import Toast from 'react-native-toast-message';
import { PermissionService } from './services/PermissionService';
import { usePermissionStore } from './store/permissionStore';
import { useAuthStore } from '../auth/store/authStore';
import { authApi } from '../auth/api/auth.api';
import { TokenStorage } from '../auth/storage/TokenStorage';
import { queryClient } from '../api/queryClient';

/**
 * Keeps mobile permissions in sync with the web's Role Management.
 *
 * Role Management itself is hidden on mobile, but whatever the web changes — a role's modules /
 * page permissions, a user's role, or deactivating the account — is applied here:
 *   • when the app returns to the foreground (throttled)
 *   • every few minutes while the app is open
 *   • on demand via syncPermissionsNow() (e.g. pull-to-refresh)
 *
 * Silent: no loading flags, and the store only updates when something actually changed,
 * so screens don't re-render on every check.
 */
const FOREGROUND_THROTTLE_MS = 30 * 1000;
const POLL_INTERVAL_MS = 3 * 60 * 1000;

let lastSyncAt = 0;
let inFlight: Promise<void> | null = null;
let appStateSub: ReturnType<typeof AppState.addEventListener> | null = null;
let pollTimer: ReturnType<typeof setInterval> | null = null;

async function refreshTokenForNewRole(): Promise<boolean> {
  try {
    const stored = await TokenStorage.getRefreshToken();
    if (!stored) return false;
    const res = await authApi.refresh(stored);
    const data: any = (res as any)?.data ?? res;
    if (!data?.token) return false;
    await TokenStorage.saveTokens(data.token, data.refreshToken || stored);
    return true;
  } catch (err: any) {
    console.warn('[PermissionSync] Token refresh after role change failed:', err?.message);
    return false;
  }
}

async function runSync(): Promise<void> {
  const auth = useAuthStore.getState();
  const role = (auth.user?.role || '').toLowerCase();
  if (!auth.isAuthenticated || !auth.user || role === 'superadmin') return;

  const data = await PermissionService.getMyPermissions();
  if (!data) return;

  // Account deactivated on the web → sign out
  if (data.isActive === false) {
    Toast.show({ type: 'error', text1: 'Account deactivated', text2: 'Your account was deactivated by an administrator.' });
    await useAuthStore.getState().logout(true);
    return;
  }

  let finalData = data;

  // Role changed on the web → get a token with the new role (API calls authorize by the token's role)
  if (data.roleChanged && data.role) {
    console.log(`[PermissionSync] Role changed on web: ${data.tokenRole} → ${data.role}`);
    const refreshed = await refreshTokenForNewRole();
    if (refreshed) {
      const again = await PermissionService.getMyPermissions();
      if (again) finalData = again;
    }
    const user = useAuthStore.getState().user;
    if (user && user.role !== data.role) {
      useAuthStore.getState().setUser({ ...user, role: data.role } as any);
    }
    // Data visible to the new role may differ — refetch everything shown on screen
    queryClient.invalidateQueries();
    Toast.show({ type: 'info', text1: 'Your role was updated', text2: `You are now signed in as ${data.role}.` });
  }

  const changed = usePermissionStore.getState().applyPermissions(finalData);
  if (changed) console.log('[PermissionSync] Permissions updated from server');
}

/** Run a sync now (deduplicated; throttled unless forced). */
export function syncPermissionsNow(force = false): Promise<void> {
  const now = Date.now();
  if (!force && now - lastSyncAt < FOREGROUND_THROTTLE_MS) return inFlight ?? Promise.resolve();
  if (inFlight) return inFlight;
  lastSyncAt = now;
  inFlight = runSync()
    .catch((err) => console.warn('[PermissionSync] Sync failed:', err?.message))
    .finally(() => {
      inFlight = null;
    });
  return inFlight;
}

/** Start foreground + periodic syncing. Returns a stop function. Safe to call repeatedly. */
export function startPermissionSync(): () => void {
  stopPermissionSync();

  appStateSub = AppState.addEventListener('change', (state: AppStateStatus) => {
    if (state === 'active') {
      syncPermissionsNow();
      if (!pollTimer) pollTimer = setInterval(() => syncPermissionsNow(), POLL_INTERVAL_MS);
    } else if (pollTimer) {
      // No polling in the background (battery)
      clearInterval(pollTimer);
      pollTimer = null;
    }
  });

  if (AppState.currentState === 'active') {
    pollTimer = setInterval(() => syncPermissionsNow(), POLL_INTERVAL_MS);
  }

  return stopPermissionSync;
}

export function stopPermissionSync(): void {
  appStateSub?.remove();
  appStateSub = null;
  if (pollTimer) clearInterval(pollTimer);
  pollTimer = null;
}
