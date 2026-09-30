import { SecureStorage } from './SecureStorage';
import { axiosInstance } from '../../api/axios';

const ACCESS_TOKEN_KEY = 'crm_access_token';
const REFRESH_TOKEN_KEY = 'crm_refresh_token';

let memoryAccessToken: string | null = null;
let memoryRefreshToken: string | null = null;

export const TokenStorage = {
  saveTokens: async (accessToken: string, refreshToken: string): Promise<void> => {
    memoryAccessToken = accessToken;
    memoryRefreshToken = refreshToken;

    if (accessToken) {
      axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
    }

    await SecureStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
    if (refreshToken) {
      await SecureStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
    }
  },

  getAccessToken: async (): Promise<string | null> => {
    if (memoryAccessToken) {
      return memoryAccessToken;
    }
    const token = await SecureStorage.getItem(ACCESS_TOKEN_KEY);
    if (token) {
      memoryAccessToken = token;
      axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }
    return token;
  },

  getAccessTokenSync: (): string | null => {
    return memoryAccessToken;
  },

  getRefreshToken: async (): Promise<string | null> => {
    if (memoryRefreshToken) {
      return memoryRefreshToken;
    }
    const rToken = await SecureStorage.getItem(REFRESH_TOKEN_KEY);
    if (rToken) {
      memoryRefreshToken = rToken;
    }
    return rToken;
  },

  clearTokens: async (): Promise<void> => {
    memoryAccessToken = null;
    memoryRefreshToken = null;
    delete axiosInstance.defaults.headers.common['Authorization'];
    await SecureStorage.removeItem(ACCESS_TOKEN_KEY);
    await SecureStorage.removeItem(REFRESH_TOKEN_KEY);
  },
};

