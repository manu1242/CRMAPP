import { apiClient } from '../../api/apiClient';
import { API_ENDPOINTS } from '../../api/endpoints';
import { LoginRequest } from '../models/LoginRequest';
import { LoginResponse } from '../models/LoginResponse';
import { getApiUrl } from '../../api/remoteConfig';

export const authApi = {
  login: async (credentials: LoginRequest): Promise<LoginResponse> => {
    const endpoint = API_ENDPOINTS.AUTH.LOGIN;
    const fullUrl = `${getApiUrl().replace(/\/$/, '')}${endpoint}`;
    const payload = {
      username: credentials.username,
      password: credentials.password,
      Username: credentials.username,
      Password: credentials.password,
    };

    if (__DEV__) console.log(`\n=== [AUTH API REQUEST] ===\nURL: ${fullUrl}\nPayload:`, JSON.stringify(payload, null, 2));

    try {
      const response = await apiClient.post<LoginResponse>(endpoint, payload);
      if (__DEV__) console.log(`\n=== [AUTH API SUCCESS] ===\nURL: ${fullUrl}\nResponse:`, JSON.stringify(response, null, 2));
      return response;
    } catch (error: any) {
      console.error(`\n=== [AUTH API ERROR] ===\nURL: ${fullUrl}\nError details:`, {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        responseData: error.response?.data,
      });
      throw error;
    }
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
