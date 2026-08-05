import axios from 'axios';
import { getApiUrl } from './remoteConfig';

/**
 * Axios instance with a dynamic baseURL resolved from the remote config.
 *
 * The baseURL is NOT set at creation time. Instead, a request interceptor
 * reads getApiUrl() on every request, so any update from remote config
 * (including mid-session tunnel URL changes) is automatically picked up.
 *
 * IMPORTANT: This interceptor is registered BEFORE setupInterceptors() is called
 * in _layout.tsx. Because Axios processes request interceptors in LIFO order,
 * the auth token interceptor (added later by setupInterceptors) will run FIRST,
 * then this baseURL interceptor runs SECOND. Both work correctly in this order.
 */
export const axiosInstance = axios.create({
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
  timeout: 10000, // 10s default timeout
});

// Dynamically set baseURL on every request from the live remote-config value
axiosInstance.interceptors.request.use((config) => {
  config.baseURL = getApiUrl();
  return config;
});
