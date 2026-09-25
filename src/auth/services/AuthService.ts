import { authApi } from '../api/auth.api';
import { LoginRequest } from '../models/LoginRequest';
import { LoginResponse, isLoginSuccess } from '../models/LoginResponse';
import { TokenStorage } from '../storage/TokenStorage';
import { SessionStorage } from '../storage/SessionStorage';
import { User } from '../models/User';

/**
 * Persist token + user session after a successful login.
 * Backend returns token at the root level (not nested in data).
 */
const saveSession = async (response: LoginResponse): Promise<void> => {
  if (!isLoginSuccess(response)) return;
  await TokenStorage.saveTokens(response.data.token, '');
  const user: User = {
    username:         response.data.user.username,
    role:             response.data.user.role,
    tenantId:         response.data.user.tenantId,
    tenantName:       response.data.user.companyName,
    subdomain:        response.data.user.subdomain,
    userId:           response.data.user.userId,
    email:            response.data.user.email,
    channelPartnerId: response.data.user.channelPartnerId,
  };
  await SessionStorage.saveUserSession(user);
};


export const AuthService = {
  /**
   * POST /api/login
   * Sends { username, password }. Token is at response root on success.
   */
  login: async (credentials: LoginRequest): Promise<LoginResponse> => {
    const response = await authApi.login(credentials);

    if (!response.success) {
      throw new Error(response.message || 'Authentication failed');
    }

    if (isLoginSuccess(response)) {
      await saveSession(response);
    } else {
      throw new Error('Unexpected login response — missing token or user');
    }

    return response;
  },

  /**
   * Re-login with a specific tenant after workspace selection.
   * POSTs username, password, and tenantId to /auth/login-workspace.
   */
  loginWithWorkspace: async (credentials: LoginRequest, tenantId: number): Promise<LoginResponse> => {
    const response = await authApi.loginWithWorkspace(credentials, tenantId);

    if (!response.success) {
      throw new Error(response.message || 'Authentication failed');
    }

    if (isLoginSuccess(response)) {
      await saveSession(response);
    } else {
      throw new Error('Expected a single tenant login response');
    }

    return response;
  },

  logout: async (): Promise<void> => {
    try {
      await authApi.logout();
    } catch (e) {
      console.warn('API logout failed, performing local logout:', e);
    } finally {
      await TokenStorage.clearTokens();
      await SessionStorage.clearUserSession();
    }
  },

  forgotPassword: async (email: string): Promise<void> => {
    await authApi.forgotPassword(email);
  },

  resetPassword: async (token: string, password: string): Promise<void> => {
    await authApi.resetPassword(token, password);
  },

  changePassword: async (currentPassword: string, newPassword: string): Promise<void> => {
    await authApi.changePassword(currentPassword, newPassword);
  },
};
