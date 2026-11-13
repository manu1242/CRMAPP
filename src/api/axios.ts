import axios from 'axios';
import { getApiUrl, getPlatformApiUrl } from './remoteConfig';

/**
 * Centralized Axios instance with dynamic multi-tenant baseURL resolution.
 *
 * Auth endpoints (login, workspace picker, password reset) always route to
 * the central platform domain (e.g. https://uproptech.com).
 *
 * Post-auth endpoints dynamically route to the company-specific subdomain
 * (e.g. https://hiriseenterprises.uproptech.com or https://srinainikaproperties.uproptech.com)
 * or remain on the platform domain for SuperAdmin.
 */
export const axiosInstance = axios.create({
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
  timeout: Number(process.env.EXPO_PUBLIC_API_TIMEOUT) || 30000,
});

axiosInstance.interceptors.request.use((config) => {
  const url = config.url || '';
  const isAuthEndpoint = (
    url.includes('/api/v1/auth/login') ||
    url.includes('/api/v1/auth/login-workspace') ||
    url.includes('/account/forgotpassword') ||
    url.includes('/account/resetpasswordwithtoken') ||
    url.includes('/account/resetpassword') ||
    url.includes('/api/v1/public/')
  );

  if (isAuthEndpoint) {
    config.baseURL = getPlatformApiUrl();
  } else {
    config.baseURL = getApiUrl();
  }

  return config;
});
