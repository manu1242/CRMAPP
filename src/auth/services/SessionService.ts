import { TokenStorage } from '../storage/TokenStorage';
import { SessionStorage } from '../storage/SessionStorage';
import { JwtService } from './JwtService';
import { User } from '../models/User';
import { profileApi } from '../api/profile.api';

export const SessionService = {
  initializeSession: async (): Promise<User | null> => {
    try {
      if (__DEV__) {
        console.log('[AUTH] Restoring session');
      }
      const accessToken = await TokenStorage.getAccessToken();

      if (!accessToken) {
        return null;
      }

      // Check if access token is valid and not expired
      if (!JwtService.isTokenExpired(accessToken)) {
        if (__DEV__) {
          console.log('[AUTH] Token restored');
        }
        // Retrieve cached user profile
        const cachedUser = await SessionStorage.getUserSession();
        if (cachedUser) {
          return cachedUser;
        }
        // Fetch from API if cache is empty
        const freshUser = await profileApi.getCurrentProfile();
        await SessionStorage.saveUserSession(freshUser);
        return freshUser;
      }

      if (__DEV__) {
        console.warn('[AUTH] Stored token expired during init, clearing session');
      }
      await TokenStorage.clearTokens();
      await SessionStorage.clearUserSession();
      return null;
    } catch (error) {
      if (__DEV__) {
        console.error('[AUTH] Session initialization failed:', error);
      }
      await TokenStorage.clearTokens();
      await SessionStorage.clearUserSession();
      return null;
    }
  },

  syncSession: async (): Promise<User | null> => {
    try {
      const user = await profileApi.getCurrentProfile();
      await SessionStorage.saveUserSession(user);
      return user;
    } catch (error) {
      if (__DEV__) {
        console.error('[AUTH] Failed to sync session profile:', error);
      }
      return null;
    }
  },
};
