import { create } from 'zustand';
import { isLoginSuccess } from '../models/LoginResponse';
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
import { resetSessionExpiryGuard } from '../../api/sessionExpiryGuard';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  isImpersonating: boolean;
  impersonatedUsername: string | null;
  pendingCredentials: { username: string; password: string } | null;
  pendingWorkspaces: any[];
  setUser: (user: User | null) => void;
  setAuthenticated: (isAuthenticated: boolean) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  login: (credentials: LoginRequest) => Promise<'success' | 'pick_workspace' | 'error'>;
  loginWithWorkspace: (tenantId: number) => Promise<'success' | 'error'>;
  logout: () => Promise<void>;
  handleSessionExpired: () => void;
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
  pendingCredentials: null,
  pendingWorkspaces: [],

  setUser: (user) => set({ user }),
  setAuthenticated: (isAuthenticated) => set({ isAuthenticated }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),

  login: async (credentials) => {
    set({ isLoading: true, error: null });
    try {
      const response = await AuthService.login(credentials);

      if (isLoginSuccess(response)) {
        resetSessionExpiryGuard();
        const u = response.data.user;
        if (__DEV__) {
          console.log('[AUTH] Login successful');
          console.log('[AUTH] Token stored');
        }
        set({
          user: {
            username: u.username,
            role: u.role,
            tenantId: u.tenantId,
            tenantName: u.companyName,
            subdomain: u.subdomain,
            userId: u.userId,
            email: u.email,
            channelPartnerId: u.channelPartnerId,
          },
          isAuthenticated: true,
          isLoading: false,
          pendingCredentials: null,
        });
        Toast.show({ type: 'success', text1: 'Success', text2: `Welcome, ${u.username}!` });
        return 'success';
      }

      throw new Error('Unexpected login response');
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || err.message || 'Login failed';
      set({ error: errorMsg, isLoading: false });
      Toast.show({ type: 'error', text1: 'Login Failed', text2: errorMsg });
      return 'error';
    }
  },

  loginWithWorkspace: async (tenantId) => {
    const { pendingCredentials } = useAuthStore.getState();
    if (!pendingCredentials) {
      Toast.show({ type: 'error', text1: 'Error', text2: 'Session expired. Please log in again.' });
      return 'error';
    }
    set({ isLoading: true, error: null });
    try {
      const response = await AuthService.loginWithWorkspace(pendingCredentials, tenantId);
      if (isLoginSuccess(response)) {
        resetSessionExpiryGuard();
        const u = response.data.user;
        if (__DEV__) {
          console.log('[AUTH] Login successful (workspace)');
          console.log('[AUTH] Token stored');
        }
        set({
          user: {
            username:         u.username,
            role:             u.role,
            tenantId:         u.tenantId,
            tenantName:       u.companyName,
            subdomain:        u.subdomain,
            userId:           u.userId,
            email:            u.email,
            channelPartnerId: u.channelPartnerId,
          },
          isAuthenticated: true,
          isLoading: false,
          pendingCredentials: null,
        });
        Toast.show({ type: 'success', text1: 'Success', text2: `Welcome, ${u.username}!` });
        return 'success';
      }
      throw new Error('Unexpected response after workspace selection');
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || err.message || 'Login failed';
      set({ error: errorMsg, isLoading: false });
      Toast.show({ type: 'error', text1: 'Login Failed', text2: errorMsg });
      return 'error';
    }
  },

  logout: async () => {
    set({ isLoading: true });
    if (__DEV__) {
      console.log('[AUTH] Logging out...');
    }
    try {
      await AuthService.logout();
      // Clear impersonation settings as well
      await SecureStorage.removeItem('crm_original_admin_token');
      await SecureStorage.removeItem('crm_is_impersonating');
      await SecureStorage.removeItem('crm_impersonated_username');

      if (__DEV__) {
        console.log('[AUTH] Session cleared');
      }

      Toast.show({
        type: 'success',
        text1: 'Logged Out',
        text2: 'Session closed successfully.',
      });
    } catch (err) {
      console.error('[AUTH] Logout error:', err);
    } finally {
      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
        isImpersonating: false,
        impersonatedUsername: null,
        pendingCredentials: null,
        pendingWorkspaces: [],
      });
    }
  },

  handleSessionExpired: () => {
    set({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      isImpersonating: false,
      impersonatedUsername: null,
      pendingCredentials: null,
      pendingWorkspaces: [],
    });
  },

  initializeSession: async () => {
    set({ isLoading: true, error: null });
    try {
      const user = await SessionService.initializeSession();
      const isImp = (await SecureStorage.getItem('crm_is_impersonating')) === 'true';
      const impUser = await SecureStorage.getItem('crm_impersonated_username');

      if (user) {
        resetSessionExpiryGuard();
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
        await apiClient.post('/account/stopimpersonation');
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
