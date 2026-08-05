import { SecureStorage } from './SecureStorage';

const ACCESS_TOKEN_KEY = 'crm_access_token';
const REFRESH_TOKEN_KEY = 'crm_refresh_token';

export const TokenStorage = {
  saveTokens: async (accessToken: string, refreshToken: string): Promise<void> => {
    await SecureStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
    await SecureStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  },

  getAccessToken: async (): Promise<string | null> => {
    return await SecureStorage.getItem(ACCESS_TOKEN_KEY);
  },

  getRefreshToken: async (): Promise<string | null> => {
    return SecureStorage.getItem(REFRESH_TOKEN_KEY);
  },

  clearTokens: async (): Promise<void> => {
    await SecureStorage.removeItem(ACCESS_TOKEN_KEY);
    await SecureStorage.removeItem(REFRESH_TOKEN_KEY);
  },
};
