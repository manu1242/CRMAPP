import { TokenStorage } from '../storage/TokenStorage';
import { SessionStorage } from '../storage/SessionStorage';
import { JwtService } from './JwtService';
import { AuthService } from './AuthService';
import { User } from '../models/User';
import { profileApi } from '../api/profile.api';

export const SessionService = {
  initializeSession: async (): Promise<User | null> => {
    try {
      const accessToken = await TokenStorage.getAccessToken();

      if (!accessToken) {
        return null;
      }

      // Check if access token is valid and not expired
      if (!JwtService.isTokenExpired(accessToken)) {
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

      // Token is expired, trigger logout to clean up
      await AuthService.logout();
      return null;
    } catch (error) {
      console.error('Session initialization failed:', error);
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
      console.error('Failed to sync session profile:', error);
      return null;
    }
  },
};
