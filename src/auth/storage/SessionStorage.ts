import { SecureStorage } from './SecureStorage';
import { User } from '../models/User';

const USER_SESSION_KEY = 'crm_user_session';

export const SessionStorage = {
  saveUserSession: async (user: User): Promise<void> => {
    await SecureStorage.setItem(USER_SESSION_KEY, JSON.stringify(user));
  },

  getUserSession: async (): Promise<User | null> => {
    const data = await SecureStorage.getItem(USER_SESSION_KEY);
    if (!data) return null;
    try {
      return JSON.parse(data) as User;
    } catch {
      return null;
    }
  },

  clearUserSession: async (): Promise<void> => {
    await SecureStorage.removeItem(USER_SESSION_KEY);
  },
};
