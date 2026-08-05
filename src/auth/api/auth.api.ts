import { apiClient } from '../../api/apiClient';
import { API_ENDPOINTS } from '../../api/endpoints';
import { LoginRequest } from '../models/LoginRequest';
import { LoginResponse } from '../models/LoginResponse';
import { RegisterRequest } from '../models/RegisterRequest';

export interface RegisterResponse {
  requiresApproval: boolean;
  redirect: string;
}

export const authApi = {
  login: async (credentials: LoginRequest): Promise<LoginResponse> => {
    // API Login uses application/json and matches { username, password }
    return apiClient.post<LoginResponse>(API_ENDPOINTS.AUTH.LOGIN, {
      username: credentials.username,
      password: credentials.password,
    });
  },

  register: async (data: RegisterRequest): Promise<RegisterResponse> => {
    // Account registration accepts multipart/form-data
    const formData = new FormData();
    formData.append('Username', data.username);
    formData.append('Email', data.email);
    if (data.phone) {
      formData.append('Phone', data.phone);
    }
    formData.append('Password', data.password);
    formData.append('Role', data.role);
    if (data.companyName) {
      formData.append('CompanyName', data.companyName);
    }

    return apiClient.post<RegisterResponse>(API_ENDPOINTS.AUTH.REGISTER, formData);
  },

  logout: async (): Promise<void> => {
    return apiClient.get<void>(API_ENDPOINTS.AUTH.LOGOUT);
  },

  forgotPassword: async (email: string): Promise<void> => {
    // Forgot password accepts application/x-www-form-urlencoded / multipart/form-data
    const formData = new FormData();
    formData.append('Email', email);

    return apiClient.post<void>(API_ENDPOINTS.AUTH.FORGOT_PASSWORD, formData);
  },

  resetPassword: async (token: string, password: string): Promise<void> => {
    // Token-based reset accepts application/x-www-form-urlencoded / multipart/form-data
    const formData = new FormData();
    formData.append('token', token);
    formData.append('newPassword', password);
    formData.append('confirmPassword', password);

    return apiClient.post<void>(API_ENDPOINTS.AUTH.RESET_PASSWORD_WITH_TOKEN, formData);
  },

  changePassword: async (currentPassword: string, newPassword: string): Promise<void> => {
    // Logged-in reset accepts application/x-www-form-urlencoded / multipart/form-data
    // Note cased keys: oldPassword, NewPassword, ConfirmPassword
    const formData = new FormData();
    formData.append('oldPassword', currentPassword);
    formData.append('NewPassword', newPassword);
    formData.append('ConfirmPassword', newPassword);

    return apiClient.post<void>(API_ENDPOINTS.AUTH.CHANGE_PASSWORD, formData);
  },
};
