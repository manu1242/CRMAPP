import { TokenStorage } from '../storage/TokenStorage';
import { SessionStorage } from '../storage/SessionStorage';
import { JwtService } from './JwtService';
import { User } from '../models/User';
import { profileApi } from '../api/profile.api';
import { setTenantSubdomain, clearTenantContext } from '../../api/remoteConfig';

export const SessionService = {
  initializeSession: async (): Promise<User | null> => {
    try {
      if (__DEV__) {
        console.log('[AUTH] Restoring session');
      }
      const accessToken = await TokenStorage.getAccessToken();

      if (!accessToken) {
        clearTenantContext();
        return null;
      }

      // Check if access token is locally valid and not expired
      if (!JwtService.isTokenExpired(accessToken)) {
        if (__DEV__) {
          console.log('[AUTH] Token not expired locally, validating with server...');
        }

        // Establish tenant context from local session cache prior to server validation
        const cachedUser = await SessionStorage.getUserSession();
        const isCachedSuperAdmin = cachedUser?.role?.trim()?.toLowerCase() === 'superadmin' || cachedUser?.tenantId === 0;
        if (cachedUser) {
          if (isCachedSuperAdmin) {
            setTenantSubdomain(null);
          } else if (cachedUser.subdomain) {
            setTenantSubdomain(cachedUser.subdomain);
          }
        }

        // Always validate against the server — local JWT expiry is not enough.
        // iOS Keychain persists tokens across sessions/reinstalls; the token may be
        // locally valid but server-invalidated (server restart, re-login on another
        // device, etc.). This server call catches that before any protected screen loads.
        try {
          let freshUser = await profileApi.getCurrentProfile();
          if (isCachedSuperAdmin) {
            freshUser = {
              ...freshUser,
              role: 'SuperAdmin',
              tenantId: 0,
              tenantName: 'Master',
              subdomain: '',
            };
          }
          await SessionStorage.saveUserSession(freshUser);
          if (freshUser.role?.trim()?.toLowerCase() === 'superadmin') {
            setTenantSubdomain(null);
          } else if (freshUser.subdomain) {
            setTenantSubdomain(freshUser.subdomain);
          }

          if (__DEV__) {
            console.log('[AUTH] Token validated with server, session restored');
          }
          return freshUser;
        } catch (serverError: any) {
          const status = serverError?.response?.status;
          if (status === 401 || status === 403 || status === 404) {
            // Token rejected by server — clear everything and force re-login
            if (__DEV__) {
              console.warn('[AUTH] Server rejected token during init (status:', status, '), clearing session');
            }
            clearTenantContext();
            await TokenStorage.clearTokens();
            await SessionStorage.clearUserSession();
            return null;
          }

          // Non-auth error (network offline, 5xx, timeout) — fall back to cached user
          // so the app stays usable offline
          if (__DEV__) {
            console.warn('[AUTH] Server unreachable during init, falling back to cached user:', serverError?.message);
          }
          return cachedUser ?? null;
        }
      }

      if (__DEV__) {
        console.warn('[AUTH] Stored token expired during init, clearing session');
      }
      clearTenantContext();
      await TokenStorage.clearTokens();
      await SessionStorage.clearUserSession();
      return null;
    } catch (error) {
      if (__DEV__) {
        console.error('[AUTH] Session initialization failed:', error);
      }
      clearTenantContext();
      await TokenStorage.clearTokens();
      await SessionStorage.clearUserSession();
      return null;
    }
  },

  syncSession: async (): Promise<User | null> => {
    try {
      const cachedUser = await SessionStorage.getUserSession();
      const isCachedSuperAdmin = cachedUser?.role?.trim()?.toLowerCase() === 'superadmin' || cachedUser?.tenantId === 0;
      let user = await profileApi.getCurrentProfile();
      if (isCachedSuperAdmin) {
        user = {
          ...user,
          role: 'SuperAdmin',
          tenantId: 0,
          tenantName: 'Master',
          subdomain: '',
        };
      }
      await SessionStorage.saveUserSession(user);
      if (user.role?.trim()?.toLowerCase() === 'superadmin') {
        setTenantSubdomain(null);
      } else if (user.subdomain) {
        setTenantSubdomain(user.subdomain);
      }
      return user;
    } catch (error) {
      if (__DEV__) {
        console.error('[AUTH] Failed to sync session profile:', error);
      }
      return null;
    }
  },
};
