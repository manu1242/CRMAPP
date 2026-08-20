import axios from 'axios';
import { getApiUrl } from './remoteConfig';
import { handleMockRequest, handleMockResponse } from './mockLeadsApi';

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

// Mock Interceptor: Dynamic client-side mocking for new endpoints
axiosInstance.interceptors.request.use(
  async (config) => {
    try {
      const mockRes = await handleMockRequest(config);
      if (mockRes) {
        // Short-circuit the request by rejecting with the mock response.
        // It will be caught and resolved in the response interceptor.
        return Promise.reject({ __isMockResponse__: true, response: mockRes });
      }
    } catch (err: any) {
      if (err && err.response) {
        return Promise.reject({ __isMockResponse__: true, response: err.response });
      }
      return Promise.reject(err);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Dynamically set baseURL on every request from the live remote-config value
axiosInstance.interceptors.request.use((config) => {
  config.baseURL = getApiUrl();
  return config;
});

// Lead mock state merger for detail responses
axiosInstance.interceptors.response.use(
  async (response) => {
    return await handleMockResponse(response);
  },
  (error) => {
    return Promise.reject(error);
  }
);

