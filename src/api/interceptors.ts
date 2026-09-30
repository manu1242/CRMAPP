import { InternalAxiosRequestConfig, AxiosResponse } from 'axios';
import Toast from 'react-native-toast-message';
import { axiosInstance } from './axios';
import { TokenStorage } from '../auth/storage/TokenStorage';
import { SessionStorage } from '../auth/storage/SessionStorage';
import { SecureStorage } from '../auth/storage/SecureStorage';
import { useAuthStore } from '../auth/store/authStore';
import {
  getIsHandlingSessionExpiry,
  setIsHandlingSessionExpiry,
  resetSessionExpiryGuard,
} from './sessionExpiryGuard';

export { resetSessionExpiryGuard };

/**
 * Global handler for HTTP 401 Unauthorized responses.
 * Guarantees single alert, clean storage clearance, and auth state reset.
 */
export const triggerSessionExpired = async () => {
  if (getIsHandlingSessionExpiry()) {
    return;
  }
  setIsHandlingSessionExpiry(true);

  if (__DEV__) {
    console.warn('[AUTH] Session expired');
    console.log('[AUTH] Clearing session');
  }

  try {
    // 1. Clear stored credentials and session data
    await TokenStorage.clearTokens();
    await SessionStorage.clearUserSession();
    await SecureStorage.removeItem('crm_original_admin_token');
    await SecureStorage.removeItem('crm_is_impersonating');
    await SecureStorage.removeItem('crm_impersonated_username');

    // 2. Clear Zustand auth store state (AuthGuardLayout in _layout.tsx will navigate to login)
    useAuthStore.getState().handleSessionExpired();

    if (__DEV__) {
      console.log('[AUTH] Redirecting to login');
    }

    // 3. Show ONE single user-friendly notification
    Toast.show({
      type: 'error',
      text1: 'Session Expired',
      text2: 'Your session has expired. Please log in again.',
    });
  } catch (err) {
    console.error('[AUTH] Error during session expiry cleanup:', err);
  }
};

let areInterceptorsRegistered = false;

export const setupInterceptors = () => {
  if (areInterceptorsRegistered) {
    return;
  }
  areInterceptorsRegistered = true;

  // Request Interceptor: Attach bearer token
  axiosInstance.interceptors.request.use(
    async (config: InternalAxiosRequestConfig) => {
      const token = await TokenStorage.getAccessToken();

      const url = config.url || '';
      const isAuthEndpoint = (
        url.includes('/api/v1/auth/login') ||
        url.includes('/api/v1/auth/login-workspace') ||
        url.includes('/account/forgotpassword') ||
        url.includes('/account/resetpasswordwithtoken') ||
        url.includes('/account/resetpassword')
      );

      if (token && !isAuthEndpoint) {
        config.headers = config.headers || {};
        if (config.headers.set) {
          config.headers.set('Authorization', `Bearer ${token}`);
        } else {
          (config.headers as any)['Authorization'] = `Bearer ${token}`;
        }
      }
      return config;
    },
    (error) => {
      console.error('[Axios Request Error]', error);
      return Promise.reject(error);
    }
  );

  // Response Interceptor: Handle errors (401, 403, 5xx, timeout, offline)
  axiosInstance.interceptors.response.use(
    (response: AxiosResponse) => {
      return response;
    },
    async (error: any) => {
      const status = error?.response?.status;
      const url = error?.config?.url || 'unknown endpoint';

      // 1. Session Expired (401 Unauthorized) — Global handling
      if (status === 401) {
        if (__DEV__) {
          console.warn(`[API] 401 Unauthorized: ${url}`);
        }

        // Optional background endpoints: a 401 here means a permissions/feature
        // issue, NOT a session expiry. Never kill the session for these.
        const OPTIONAL_ENDPOINTS = [
          '/api/v1/notifications/unread-count',
          '/api/v1/notifications/save-token',
          '/api/v1/notifications/test-notification',
        ];
        const isOptional = OPTIONAL_ENDPOINTS.some((ep) => url.includes(ep));
        if (isOptional) {
          // Silently reject — the caller's catch block handles empty state
          return Promise.reject(error);
        }

        // Only trigger session expiry if the user is currently authenticated.
        // If isAuthenticated is already false, the session is already cleared —
        // calling triggerSessionExpired() again would needlessly lock the guard,
        // which then silently swallows subsequent 401s from in-flight requests.
        const { useAuthStore } = await import('../auth/store/authStore');
        if (useAuthStore.getState().isAuthenticated) {
          await triggerSessionExpired();
        }
        return Promise.reject(error);
      }

      // 2. Forbidden (403) — Log only, DO NOT log out user
      if (status === 403) {
        if (__DEV__) {
          console.warn(`[API] 403 Forbidden: ${url}`);
        }
        return Promise.reject(error);
      }

      // 3. Server Errors (500, 502, 503, 504)
      if (status && status >= 500) {
        if (__DEV__) {
          console.error(`[API] ${status} Server Error: ${url}`);
        }
        if (status >= 502 && status <= 504) {
          Toast.show({
            type: 'error',
            text1: 'Server Unavailable',
            text2: 'The backend server is under maintenance. Please try again later.',
          });
        }
        return Promise.reject(error);
      }

      // 4. Timeout Error
      if (error?.code === 'ECONNABORTED' || (error?.message && error.message.toLowerCase().includes('timeout'))) {
        if (__DEV__) {
          console.warn(`[API] Request Timeout: ${url}`);
        }
        Toast.show({
          type: 'error',
          text1: 'Request Timeout',
          text2: 'The request took too long. Please check your connection speed.',
        });
        return Promise.reject(error);
      }

      // 5. Network Offline / DNS Failure
      if (error?.message === 'Network Error' || (!error?.response && error?.code === 'ERR_NETWORK')) {
        if (__DEV__) {
          console.warn(`[API] Network Error: ${url}`);
        }
        // Network state is handled by NetworkProvider banner, no session logout triggered
        return Promise.reject(error);
      }

      return Promise.reject(error);
    }
  );
};
