import { create } from 'zustand';
import { isLoginSuccess } from '../models/LoginResponse';
import Toast from 'react-native-toast-message';
import { User } from '../models/User';
import { LoginRequest } from '../models/LoginRequest';
import { AuthService } from '../services/AuthService';
import { SessionService } from '../services/SessionService';
import { JwtService } from '../services/JwtService';
import { SecureStorage } from '../storage/SecureStorage';
import { TokenStorage } from '../storage/TokenStorage';
import { SessionStorage } from '../storage/SessionStorage';
import { profileApi } from '../api/profile.api';
import { apiClient } from '../../api/apiClient';
import { resetSessionExpiryGuard } from '../../api/sessionExpiryGuard';
import { DeviceNotificationService } from '../../Services/DeviceNotificationService';
import { queryClient } from '../../api/queryClient';
import { QueryPersister } from '../../api/queryPersister';
import { usePermissionStore } from '../../authorization/store/permissionStore';
import { useRolePermissionsStore } from '../../hooks/useRolePermissionsStore';
import { useLeadStore } from '../../admin/store/useLeadStore';
import { useUserStore } from '../../admin/store/useUserStore';
import { useTenantFilterStore } from '../../superadmin/tenants/store/tenantStore';
import { setTenantSubdomain, clearTenantContext } from '../../api/remoteConfig';
import { resetNavigationLock } from '../../navigation/safeNavigation';

export type AuthStatus = 'initializing' | 'unauthenticated' | 'authenticating' | 'loading-profile' | 'authenticated';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  authStatus: AuthStatus;
  error: string | null;
  isImpersonating: boolean;
  impersonatedUsername: string | null;
  pendingCredentials: { username: string; password: string; rememberMe?: boolean } | null;
  pendingWorkspaces: any[];
  setUser: (user: User | null) => void;
  setAuthenticated: (isAuthenticated: boolean) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  login: (credentials: LoginRequest) => Promise<'success' | 'pick_workspace' | 'error'>;
  loginWithWorkspace: (tenantId: number) => Promise<'success' | 'error'>;
  logout: (skipToast?: boolean) => Promise<void>;
  handleSessionExpired: () => void;
  initializeSession: () => Promise<void>;
  impersonate: (token: string, targetUser: any) => Promise<void>;
  stopImpersonation: () => Promise<any>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,
  authStatus: 'unauthenticated',
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
    // 1. Immediately wipe previous session cache before starting authentication
    try {
      queryClient.cancelQueries();
      queryClient.clear();
      await QueryPersister.clearCache();
    } catch {
      // Ignore cache clearing errors
    }

    set({ isLoading: true, authStatus: 'authenticating', error: null });
    try {
      const response = await AuthService.login(credentials);

      if (isLoginSuccess(response)) {
        resetSessionExpiryGuard();
        const u = response.data.user;
        if (__DEV__) {
          console.log('[AUTH] Login successful, loading authoritative profile...');
        }

        set({ authStatus: 'loading-profile' });

        // Build base user from login response
        const isSuperAdminLogin = 
          (u.role || '').trim().toLowerCase() === 'superadmin' || 
          u.tenantId === 0 || 
          (u.companyName || '').toLowerCase() === 'master';

        let authoritativeUser: User = {
          username: u.username,
          role: isSuperAdminLogin ? 'SuperAdmin' : u.role,
          tenantId: isSuperAdminLogin ? 0 : u.tenantId,
          tenantName: isSuperAdminLogin ? 'Master' : u.companyName,
          subdomain: isSuperAdminLogin ? '' : u.subdomain,
          userId: u.userId,
          email: u.email,
          channelPartnerId: u.channelPartnerId,
        };

        // Query authoritative backend profile with the fresh token
        try {
          const profile = await profileApi.getCurrentProfile();
          if (profile) {
            const resolvedRole = isSuperAdminLogin 
              ? 'SuperAdmin' 
              : ((profile.role || u.role) ? (profile.role || u.role).trim() : u.role);

            authoritativeUser = {
              ...authoritativeUser,
              ...profile,
              // Strictly resolve role: SuperAdmin is never downgraded
              role: resolvedRole,
              tenantId: isSuperAdminLogin ? 0 : (profile.tenantId !== undefined ? profile.tenantId : u.tenantId),
              tenantName: isSuperAdminLogin ? 'Master' : ((profile as any).companyName || profile.tenantName || u.companyName),
              subdomain: isSuperAdminLogin ? '' : (profile.subdomain !== undefined ? profile.subdomain : u.subdomain),
            };
          }
        } catch (profileErr) {
          if (__DEV__) {
            console.warn('[AUTH] Could not fetch /api/v1/profile, using login response:', profileErr);
          }
        }

        // Persist session to local storage
        await SessionStorage.saveUserSession(authoritativeUser);

        // Dynamically route API base URL: SuperAdmin -> Platform URL; Company User -> Company Subdomain URL
        if (authoritativeUser.role?.trim()?.toLowerCase() === 'superadmin') {
          setTenantSubdomain(null);
        } else if (authoritativeUser.subdomain) {
          setTenantSubdomain(authoritativeUser.subdomain);
        }

        set({
          user: authoritativeUser,
          isAuthenticated: true,
          isLoading: false,
          authStatus: 'authenticated',
          pendingCredentials: null,
        });

        // Fetch live role-based permissions immediately
        usePermissionStore.getState().fetchMyPermissions(true).catch(() => {});

        // Register device push notification token for authenticated session
        DeviceNotificationService.init().catch((err) => {
          console.warn('[AUTH] Push notification registration error:', err?.message);
        });

        Toast.show({ type: 'success', text1: 'Success', text2: `Welcome, ${authoritativeUser.username}!` });
        return 'success';
      }

      throw new Error('Unexpected login response');
    } catch (err: any) {
      const status = err.response?.status;
      const respData = err.response?.data;
      const errorMsg = respData?.message || err.message || 'Login failed';

      let toastTitle = 'Login Failed';
      let displayMsg = typeof errorMsg === 'string' ? errorMsg : 'Login failed';

      if (status === 404) {
        if (typeof errorMsg === 'string' && errorMsg.toLowerCase().includes('deleted')) {
          toastTitle = 'Account Deleted';
          displayMsg = 'This account has been deactivated or suspended. Please contact the Super Admin to reactivate your account.';
        } else {
          toastTitle = 'Account Not Found';
        }
      } else if (status === 403) {
        toastTitle = 'Account Suspended';
        displayMsg = 'Your account has been deactivated or suspended. Please contact the Super Admin to reactivate your account.';
      } else if (status === 401) {
        toastTitle = 'Invalid Credentials';
      }

      set({ error: displayMsg, isLoading: false, authStatus: 'unauthenticated', isAuthenticated: false, user: null });
      Toast.show({ type: 'error', text1: toastTitle, text2: displayMsg, visibilityTime: 5000 });
      return 'error';
    }
  },

  loginWithWorkspace: async (tenantId) => {
    const { pendingCredentials } = useAuthStore.getState();
    if (!pendingCredentials) {
      Toast.show({ type: 'error', text1: 'Error', text2: 'Session expired. Please log in again.' });
      return 'error';
    }

    try {
      queryClient.cancelQueries();
      queryClient.clear();
      await QueryPersister.clearCache();
    } catch {
      // Ignore cache clearing errors
    }

    set({ isLoading: true, authStatus: 'authenticating', error: null });
    try {
      const response = await AuthService.loginWithWorkspace(pendingCredentials, tenantId);
      if (isLoginSuccess(response)) {
        resetSessionExpiryGuard();
        const u = response.data.user;
        if (__DEV__) {
          console.log('[AUTH] Workspace login successful, loading authoritative profile...');
        }

        set({ authStatus: 'loading-profile' });

        const isSuperAdminLogin = 
          (u.role || '').trim().toLowerCase() === 'superadmin' || 
          u.tenantId === 0 || 
          (u.companyName || '').toLowerCase() === 'master';

        let authoritativeUser: User = {
          username: u.username,
          role: isSuperAdminLogin ? 'SuperAdmin' : u.role,
          tenantId: isSuperAdminLogin ? 0 : u.tenantId,
          tenantName: isSuperAdminLogin ? 'Master' : u.companyName,
          subdomain: isSuperAdminLogin ? '' : u.subdomain,
          userId: u.userId,
          email: u.email,
          channelPartnerId: u.channelPartnerId,
        };

        try {
          const profile = await profileApi.getCurrentProfile();
          if (profile) {
            const resolvedRole = isSuperAdminLogin 
              ? 'SuperAdmin' 
              : ((profile.role || u.role) ? (profile.role || u.role).trim() : u.role);

            authoritativeUser = {
              ...authoritativeUser,
              ...profile,
              role: resolvedRole,
              tenantId: isSuperAdminLogin ? 0 : (profile.tenantId !== undefined ? profile.tenantId : u.tenantId),
              tenantName: isSuperAdminLogin ? 'Master' : ((profile as any).companyName || profile.tenantName || u.companyName),
              subdomain: isSuperAdminLogin ? '' : (profile.subdomain !== undefined ? profile.subdomain : u.subdomain),
            };
          }
        } catch (profileErr) {
          if (__DEV__) {
            console.warn('[AUTH] Could not fetch /api/v1/profile after workspace login:', profileErr);
          }
        }

        await SessionStorage.saveUserSession(authoritativeUser);

        // Dynamically route API base URL: SuperAdmin -> Platform URL; Company User -> Company Subdomain URL
        if (authoritativeUser.role?.trim()?.toLowerCase() === 'superadmin') {
          setTenantSubdomain(null);
        } else if (authoritativeUser.subdomain) {
          setTenantSubdomain(authoritativeUser.subdomain);
        }

        set({
          user: authoritativeUser,
          isAuthenticated: true,
          isLoading: false,
          authStatus: 'authenticated',
          pendingCredentials: null,
        });

        // Fetch live role-based permissions immediately
        usePermissionStore.getState().fetchMyPermissions(true).catch(() => {});

        // Register device push notification token for authenticated session
        DeviceNotificationService.init().catch((err) => {
          console.warn('[AUTH] Push notification registration error:', err?.message);
        });

        Toast.show({ type: 'success', text1: 'Success', text2: `Welcome, ${authoritativeUser.username}!` });
        return 'success';
      }
      throw new Error('Unexpected response after workspace selection');
    } catch (err: any) {
      const status = err.response?.status;
      const respData = err.response?.data;
      const errorMsg = respData?.message || err.message || 'Login failed';

      let toastTitle = 'Login Failed';
      let displayMsg = typeof errorMsg === 'string' ? errorMsg : 'Login failed';

      if (status === 404) {
        if (typeof errorMsg === 'string' && errorMsg.toLowerCase().includes('deleted')) {
          toastTitle = 'Account Deleted';
          displayMsg = 'This account has been deactivated or suspended. Please contact the Super Admin to reactivate your account.';
        } else {
          toastTitle = 'Account Not Found';
        }
      } else if (status === 403) {
        toastTitle = 'Account Suspended';
        displayMsg = 'Your account has been deactivated or suspended. Please contact the Super Admin to reactivate your account.';
      } else if (status === 401) {
        toastTitle = 'Invalid Credentials';
      }

      set({ error: displayMsg, isLoading: false, authStatus: 'unauthenticated', isAuthenticated: false, user: null });
      Toast.show({ type: 'error', text1: toastTitle, text2: displayMsg, visibilityTime: 5000 });
      return 'error';
    }
  },

  logout: async (skipToast = false) => {
    // 1. Immediately reset navigation lock & in-memory TanStack query cache
    resetNavigationLock();
    try {
      queryClient.cancelQueries();
      queryClient.clear();
    } catch {}

    // 2. Immediately clear all role-specific global Zustand stores
    try {
      usePermissionStore.getState().resetPermissions();
      useRolePermissionsStore.getState().clearCache();
      useLeadStore.setState({ leads: [], totalCount: 0, selectedLeadDetails: null });
      useUserStore.setState({ users: [], summary: null });
      useTenantFilterStore.getState().resetFilters();
    } catch {}

    // 3. Immediately reset dynamic tenant routing back to platform domain
    clearTenantContext();

    // 4. INSTANTLY transition auth state so UI unmounts and navigates with ZERO lag
    set({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      authStatus: 'unauthenticated',
      error: null,
      isImpersonating: false,
      impersonatedUsername: null,
      pendingCredentials: null,
      pendingWorkspaces: [],
    });

    if (!skipToast) {
      Toast.show({
        type: 'success',
        text1: 'Logged Out',
        text2: 'Session closed successfully.',
      });
    }

    // 5. Asynchronously clear disk persistence and notify backend in the background (fire-and-forget)
    Promise.allSettled([
      DeviceNotificationService.unregister(),
      AuthService.logout(),
      QueryPersister.clearCache(),
      TokenStorage.clearTokens(),
      SessionStorage.clearUserSession(),
      SecureStorage.removeItem('crm_original_admin_token'),
      SecureStorage.removeItem('crm_is_impersonating'),
      SecureStorage.removeItem('crm_impersonated_username'),
    ]).catch((err) => {
      if (__DEV__) console.warn('[AUTH] Background cleanup error:', err);
    });
  },

  handleSessionExpired: () => {
    queryClient.cancelQueries();
    queryClient.clear();
    QueryPersister.clearCache().catch(() => {});
    TokenStorage.clearTokens().catch(() => {});
    SessionStorage.clearUserSession().catch(() => {});
    DeviceNotificationService.unregister().catch(() => {});
    usePermissionStore.getState().resetPermissions();
    useRolePermissionsStore.getState().clearCache();
    useLeadStore.setState({ leads: [], totalCount: 0, selectedLeadDetails: null });
    useUserStore.setState({ users: [], summary: null });
    useTenantFilterStore.getState().resetFilters();
    clearTenantContext();
    set({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      authStatus: 'unauthenticated',
      isImpersonating: false,
      impersonatedUsername: null,
      pendingCredentials: null,
      pendingWorkspaces: [],
    });
  },

  initializeSession: async () => {
    set({ isLoading: true, authStatus: 'initializing', error: null });
    try {
      const user = await SessionService.initializeSession();
      const isImp = (await SecureStorage.getItem('crm_is_impersonating')) === 'true';
      const impUser = await SecureStorage.getItem('crm_impersonated_username');

      if (user) {
        resetSessionExpiryGuard();
        if (user.role?.trim()?.toLowerCase() === 'superadmin') {
          setTenantSubdomain(null);
        } else if (user.subdomain) {
          setTenantSubdomain(user.subdomain);
        }
        set({
          user,
          isAuthenticated: true,
          isLoading: false,
          authStatus: 'authenticated',
          isImpersonating: isImp,
          impersonatedUsername: impUser,
        });
        // Synchronize permissions on session restore
        usePermissionStore.getState().fetchMyPermissions().catch(() => {});
        // Register device push token for restored session
        DeviceNotificationService.init().catch((err) => {
          console.warn('[AUTH] Session restore push init notice:', err?.message);
        });
      } else {
        clearTenantContext();
        queryClient.cancelQueries();
        queryClient.clear();
        await QueryPersister.clearCache();
        set({
          user: null,
          isAuthenticated: false,
          isLoading: false,
          authStatus: 'unauthenticated',
          isImpersonating: false,
          impersonatedUsername: null,
        });
      }
    } catch (err: any) {
      clearTenantContext();
      queryClient.cancelQueries();
      queryClient.clear();
      await QueryPersister.clearCache();
      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        authStatus: 'unauthenticated',
        error: 'Failed to restore session',
        isImpersonating: false,
        impersonatedUsername: null,
      });
    }
  },

  impersonate: async (token: string, targetUser: any) => {
    set({ isLoading: true });
    try {
      // 1. Immediately wipe previous session query caches
      try {
        queryClient.cancelQueries();
        queryClient.clear();
        await QueryPersister.clearCache();
      } catch {}

      const currentToken = await TokenStorage.getAccessToken();
      const alreadyImpersonating = (await SecureStorage.getItem('crm_is_impersonating')) === 'true';
      if (!alreadyImpersonating && currentToken) {
        await SecureStorage.setItem('crm_original_admin_token', currentToken);
      }

      await TokenStorage.saveTokens(token, '');
      await SecureStorage.setItem('crm_is_impersonating', 'true');
      await SecureStorage.setItem('crm_impersonated_username', targetUser.username || targetUser.email);

      // Extract tenantId, subdomain, channelPartnerId from JWT token claims to guarantee completeness
      let finalTargetUser = { ...targetUser };
      const claims: any = JwtService.decodeToken(token);
      if (claims) {
        const rawTenantId = claims.TenantId || claims.tenantId;
        if (rawTenantId && Number(rawTenantId) > 0) {
          finalTargetUser.tenantId = Number(rawTenantId);
        }
        const claimSubdomain = claims.Subdomain || claims.subdomain;
        if (claimSubdomain) {
          finalTargetUser.subdomain = claimSubdomain;
        }
        const claimCpId = claims.ChannelPartnerId || claims.channelPartnerId;
        if (claimCpId) {
          finalTargetUser.channelPartnerId = claimCpId;
        }
      }

      await SessionStorage.saveUserSession(finalTargetUser);
      if (finalTargetUser.role?.trim()?.toLowerCase() === 'superadmin') {
        setTenantSubdomain(null);
      } else if (finalTargetUser.subdomain) {
        setTenantSubdomain(finalTargetUser.subdomain);
      }

      // Fetch live permissions for the impersonated user context before updating state
      try {
        await usePermissionStore.getState().fetchMyPermissions(true);
      } catch {}

      set({
        user: finalTargetUser,
        isAuthenticated: true,
        isImpersonating: true,
        impersonatedUsername: finalTargetUser.username || finalTargetUser.email,
        isLoading: false,
        authStatus: 'authenticated',
      });

      Toast.show({
        type: 'success',
        text1: 'Impersonation Started',
        text2: `Logged in as ${finalTargetUser.username || finalTargetUser.email}`,
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
        await apiClient.post('/api/v1/usermanagement/Impersonate/exit');
      } catch (e) {
        // Backend notification optional
      }

      const originalClaims: any = JwtService.decodeToken(originalToken);
      const isSuperAdminRestored =
        originalClaims?.IsSuperAdmin === 'true' ||
        originalClaims?.role?.toLowerCase() === 'superadmin' ||
        originalClaims?.Role?.toLowerCase() === 'superadmin';

      let freshAdmin: any;
      try {
        freshAdmin = await profileApi.getCurrentProfile();
      } catch (profileErr) {
        freshAdmin = {
          userId: Number(originalClaims?.UserId || originalClaims?.sub || 1),
          username: originalClaims?.name || originalClaims?.unique_name || 'Admin',
          email: originalClaims?.email || '',
          role: isSuperAdminRestored ? 'SuperAdmin' : 'Admin',
          tenantId: isSuperAdminRestored ? 0 : Number(originalClaims?.TenantId || 0),
          subdomain: isSuperAdminRestored ? '' : (originalClaims?.Subdomain || ''),
        };
      }

      if (isSuperAdminRestored) {
        freshAdmin = {
          ...freshAdmin,
          role: 'SuperAdmin',
          tenantId: 0,
          subdomain: '',
        };
      }

      await SessionStorage.saveUserSession(freshAdmin);
      if (freshAdmin.role?.trim()?.toLowerCase() === 'superadmin' || isSuperAdminRestored) {
        setTenantSubdomain(null);
      } else if (freshAdmin.subdomain) {
        setTenantSubdomain(freshAdmin.subdomain);
      }

      // Restore original admin permissions immediately
      try {
        await usePermissionStore.getState().fetchMyPermissions(true);
      } catch {
        usePermissionStore.getState().resetPermissions();
      }

      set({
        user: freshAdmin,
        isAuthenticated: true,
        isImpersonating: false,
        impersonatedUsername: null,
        isLoading: false,
        authStatus: 'authenticated',
      });

      Toast.show({
        type: 'success',
        text1: 'Impersonation Ended',
        text2: `Returned to ${freshAdmin.username} context`,
      });

      return freshAdmin;
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
