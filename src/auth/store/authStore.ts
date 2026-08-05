import { create } from 'zustand';
import Toast from 'react-native-toast-message';
import { User } from '../models/User';
import { LoginRequest } from '../models/LoginRequest';
import { AuthService } from '../services/AuthService';
import { SessionService } from '../services/SessionService';
import { SecureStorage } from '../storage/SecureStorage';
import { TokenStorage } from '../storage/TokenStorage';
import { SessionStorage } from '../storage/SessionStorage';
import { profileApi } from '../api/profile.api';
import { apiClient } from '../../api/apiClient';
import { API_ENDPOINTS } from '../../api/endpoints';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  isImpersonating: boolean;
  impersonatedUsername: string | null;
  setUser: (user: User | null) => void;
  setAuthenticated: (isAuthenticated: boolean) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  login: (credentials: LoginRequest) => Promise<void>;
  logout: () => Promise<void>;
  initializeSession: () => Promise<void>;
  impersonate: (token: string, targetUser: any) => Promise<void>;
  stopImpersonation: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
  isImpersonating: false,
  impersonatedUsername: null,

  setUser: (user) => set({ user }),
  setAuthenticated: (isAuthenticated) => set({ isAuthenticated }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),

  login: async (credentials) => {
    set({ isLoading: true, error: null });
    try {
      const response = await AuthService.login(credentials);
      set({
        user: response.user,
        isAuthenticated: true,
        isLoading: false,
      });
      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'Logged in successfully!',
      });
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || err.message || 'Login failed';
      set({ error: errorMsg, isLoading: false });
      Toast.show({
        type: 'error',
        text1: 'Login Failed',
        text2: errorMsg,
      });
      throw err;
    }
  },

  logout: async () => {
    set({ isLoading: true });
    try {
      await AuthService.logout();
      // Clear impersonation settings as well
      await SecureStorage.removeItem('crm_original_admin_token');
      await SecureStorage.removeItem('crm_is_impersonating');
      await SecureStorage.removeItem('crm_impersonated_username');

      Toast.show({
        type: 'success',
        text1: 'Logged Out',
        text2: 'Session closed successfully.',
      });
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
        isImpersonating: false,
        impersonatedUsername: null,
      });
    }
  },

  initializeSession: async () => {
    set({ isLoading: true, error: null });
    try {
      const user = await SessionService.initializeSession();
      const isImp = (await SecureStorage.getItem('crm_is_impersonating')) === 'true';
      const impUser = await SecureStorage.getItem('crm_impersonated_username');

      if (user) {
        set({
          user,
          isAuthenticated: true,
          isLoading: false,
          isImpersonating: isImp,
          impersonatedUsername: impUser,
        });
      } else {
        set({
          user: null,
          isAuthenticated: false,
          isLoading: false,
          isImpersonating: false,
          impersonatedUsername: null,
        });
      }
    } catch (err: any) {
      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: 'Failed to restore session',
        isImpersonating: false,
        impersonatedUsername: null,
      });
    }
  },

  impersonate: async (token: string, targetUser: any) => {
    set({ isLoading: true });
    try {
      const currentToken = await TokenStorage.getAccessToken();
      const alreadyImpersonating = (await SecureStorage.getItem('crm_is_impersonating')) === 'true';
      if (!alreadyImpersonating && currentToken) {
        await SecureStorage.setItem('crm_original_admin_token', currentToken);
      }

      await TokenStorage.saveTokens(token, '');
      await SecureStorage.setItem('crm_is_impersonating', 'true');
      await SecureStorage.setItem('crm_impersonated_username', targetUser.username || targetUser.email);
      await SessionStorage.saveUserSession(targetUser);

      set({
        user: targetUser,
        isAuthenticated: true,
        isImpersonating: true,
        impersonatedUsername: targetUser.username || targetUser.email,
        isLoading: false,
      });

      Toast.show({
        type: 'success',
        text1: 'Impersonation Started',
        text2: `Logged in as ${targetUser.username || targetUser.email}`,
      });
    } catch (err: any) {
      console.error('Error starting impersonation:', err);
      set({ isLoading: false });
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: err.message || 'Failed to start impersonation',
      });
    }
  },

  stopImpersonation: async () => {
    set({ isLoading: true });
    try {
      const originalToken = await SecureStorage.getItem('crm_original_admin_token');
      if (!originalToken) {
        throw new Error('Original admin token not found.');
      }

      await TokenStorage.saveTokens(originalToken, '');
      await SecureStorage.removeItem('crm_original_admin_token');
      await SecureStorage.removeItem('crm_is_impersonating');
      await SecureStorage.removeItem('crm_impersonated_username');

      try {
        await apiClient.post(API_ENDPOINTS.AUTH.STOP_IMPERSONATION);
      } catch (e) {
        // Backend notification optional
      }

      const freshAdmin = await profileApi.getCurrentProfile();
      await SessionStorage.saveUserSession(freshAdmin);

      set({
        user: freshAdmin,
        isAuthenticated: true,
        isImpersonating: false,
        impersonatedUsername: null,
        isLoading: false,
      });

      Toast.show({
        type: 'success',
        text1: 'Impersonation Ended',
        text2: `Returned to ${freshAdmin.username} context`,
      });
    } catch (err: any) {
      console.error('Error stopping impersonation:', err);
      set({ isLoading: false });
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: err.message || 'Failed to restore admin context',
      });
    }
  },
}));
