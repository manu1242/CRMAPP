import { authApi, RegisterResponse } from '../api/auth.api';
import { LoginRequest } from '../models/LoginRequest';
import { LoginResponse } from '../models/LoginResponse';
import { RegisterRequest } from '../models/RegisterRequest';
import { TokenStorage } from '../storage/TokenStorage';
import { SessionStorage } from '../storage/SessionStorage';

export const AuthService = {
  login: async (credentials: LoginRequest): Promise<LoginResponse> => {
    const response = await authApi.login(credentials);
    if (response.success && response.token) {
      await TokenStorage.saveTokens(response.token, '');
      await SessionStorage.saveUserSession(response.user);
    } else {
      throw new Error('Authentication failed');
    }
    return response;
  },

  register: async (data: RegisterRequest): Promise<RegisterResponse> => {
    return authApi.register(data);
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
