import { TokenStorage } from '../storage/TokenStorage';

export const TokenService = {
  getAccessToken: async (): Promise<string | null> => {
    return TokenStorage.getAccessToken();
  },

  getRefreshToken: async (): Promise<string | null> => {
    return TokenStorage.getRefreshToken();
  },

  saveTokens: async (accessToken: string, refreshToken: string): Promise<void> => {
    await TokenStorage.saveTokens(accessToken, refreshToken);
  },

  clearTokens: async (): Promise<void> => {
    await TokenStorage.clearTokens();
  },
};
