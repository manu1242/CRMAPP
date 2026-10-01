import { apiClient } from '../../api/apiClient';
import { API_ENDPOINTS } from '../../api/endpoints';
import { LoginRequest } from '../models/LoginRequest';
import { LoginResponse } from '../models/LoginResponse';
import { getApiUrl } from '../../api/remoteConfig';

const ENDPOINT = API_ENDPOINTS.AUTH.LOGIN;

export const authApi = {
  /**
   * Initial login — no tenant context.
   * Backend will check SuperAdmin, then scan all active tenants.
   */
  login: async (credentials: LoginRequest): Promise<LoginResponse> => {
    const fullUrl = `${getApiUrl().replace(/\/$/, '')}${ENDPOINT}`;
    const payload = {
      username: credentials.username,
      password: credentials.password,
    };

    if (__DEV__) console.log(`\n=== [AUTH API REQUEST] ===\nURL: ${fullUrl}\nPayload:`, JSON.stringify(payload, null, 2));

    try {
      const response = await apiClient.post<LoginResponse>(ENDPOINT, payload);
      if (__DEV__) console.log(`\n=== [AUTH API SUCCESS] ===\nResponse:`, JSON.stringify(response, null, 2));
      return response;
    } catch (error: any) {
      console.error(`\n=== [AUTH API ERROR] ===\nURL: ${fullUrl}\nError:`, {
        message: error.message,
        status: error.response?.status,
        responseData: error.response?.data,
      });
      throw error;
    }
  },

  /**
   * Re-login after workspace selection.
   * POSTs username, password, and tenantId to /auth/login-workspace.
   */
  loginWithWorkspace: async (credentials: LoginRequest, tenantId: number): Promise<LoginResponse> => {
    const endpoint = API_ENDPOINTS.AUTH.LOGIN_WORKSPACE;
    const fullUrl = `${getApiUrl().replace(/\/$/, '')}${endpoint}`;
    const payload = {
      username: credentials.username,
      password: credentials.password,
      tenantId,
    };

    if (__DEV__) console.log(`\n=== [AUTH API WORKSPACE LOGIN] ===\nURL: ${fullUrl}\nTenantId: ${tenantId}`);

    try {
      const response = await apiClient.post<LoginResponse>(endpoint, payload);
      if (__DEV__) console.log(`\n=== [AUTH API WORKSPACE SUCCESS] ===\nResponse:`, JSON.stringify(response, null, 2));
      return response;
    } catch (error: any) {
      console.error(`\n=== [AUTH API WORKSPACE ERROR] ===\nTenantId: ${tenantId}\nError:`, {
        message: error.message,
        status: error.response?.status,
        responseData: error.response?.data,
      });
      throw error;
    }
  },

  /**
   * Logout — POST to /auth/logout.
   * JWT is stateless: the caller must delete the stored token after this resolves.
   */
  logout: async (): Promise<void> => {
    return apiClient.post<void>(API_ENDPOINTS.AUTH.LOGOUT);
  },

  /**
   * Refresh the current token before it expires.
   */
  refresh: async (): Promise<RefreshTokenResponse> => {
    return apiClient.post<RefreshTokenResponse>(API_ENDPOINTS.AUTH.REFRESH);
  },

  /**
   * Fetch the authenticated user's profile.
   */
  getProfile: async (): Promise<ProfileResponse> => {
    return apiClient.get<ProfileResponse>(API_ENDPOINTS.AUTH.PROFILE);
  },

  forgotPassword: async (email: string): Promise<any> => {
    return apiClient.post(API_ENDPOINTS.AUTH.FORGOT_PASSWORD, { email });
  },

  verifyResetToken: async (email: string, token: string): Promise<any> => {
    return apiClient.post(API_ENDPOINTS.AUTH.VERIFY_RESET_TOKEN, { email, token });
  },

  resetPassword: async (
    email: string,
    token: string,
    newPassword: string,
    confirmPassword?: string
  ): Promise<any> => {
    return apiClient.post(API_ENDPOINTS.AUTH.RESET_PASSWORD, {
      email,
      token,
      newPassword,
      confirmPassword: confirmPassword || newPassword,
    });
  },

  changePassword: async (
    currentPassword: string,
    newPassword: string,
    confirmPassword?: string
  ): Promise<any> => {
    return apiClient.post(API_ENDPOINTS.AUTH.CHANGE_PASSWORD, {
      currentPassword,
      newPassword,
      confirmPassword: confirmPassword || newPassword,
    });
  },
};

// ── Response types for new endpoints ────────────────────────────────────────

export interface RefreshTokenResponse {
  success: boolean;
  message?: string;
  data: {
    token: string;
    expires: string;
  };
}

export interface ProfileResponse {
  success: boolean;
  message?: string;
  data: {
    userId: number;
    username: string;
    email: string;
    role: string;
    phone: string;
    isActive: boolean;
  };
}
