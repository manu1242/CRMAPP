import { InternalAxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import Toast from 'react-native-toast-message';
import { axiosInstance } from './axios';
import { TokenStorage } from '../auth/storage/TokenStorage';
import { AuthService } from '../auth/services/AuthService';

export const setupInterceptors = () => {
  // Request Interceptor: Attach bearer token
  axiosInstance.interceptors.request.use(
    async (config: InternalAxiosRequestConfig) => {
      const token = await TokenStorage.getAccessToken();
      
      const isAuthEndpoint = config.url && (
        config.url.includes('/api/login') ||
        config.url.includes('/account/login') ||
        config.url.includes('/account/register') ||
        config.url.includes('/account/forgotpassword') ||
        config.url.includes('/account/resetpasswordwithtoken')
      );

      if (token && config.headers && !isAuthEndpoint) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => {
      console.error('[Axios Request Error]', error);
      return Promise.reject(error);
    }
  );

  // Response Interceptor: Handle errors (401, timeout, offline, server down)
  axiosInstance.interceptors.response.use(
    (response: AxiosResponse) => {
      return response;
    },
    async (error: AxiosError) => {
      // 1. Session Expired (401)
      if (error.response && error.response.status === 401) {
        Toast.show({
          type: 'error',
          text1: 'Session Expired',
          text2: 'Your session has expired. Please log in again.',
        });
        await AuthService.logout();
      }

      // 2. Timeout Error
      else if (error.code === 'ECONNABORTED' || error.message.toLowerCase().includes('timeout')) {
        Toast.show({
          type: 'error',
          text1: 'Request Timeout',
          text2: 'The request took too long. Please check your connection speed.',
        });
      }

      // 3. Network Offline / DNS Failure
      else if (error.message === 'Network Error') {
        Toast.show({
          type: 'error',
          text1: 'Network Error',
          text2: 'Unable to connect to the server. Check if you are offline.',
        });
      }

      // 4. Backend Server Down (502 / 503 / 504)
      else if (error.response && error.response.status >= 502 && error.response.status <= 504) {
        Toast.show({
          type: 'error',
          text1: 'Server Unavailable',
          text2: 'The backend server is under maintenance. Please try again later.',
        });
      }

      return Promise.reject(error);
    }
  );
};
