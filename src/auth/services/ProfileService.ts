import { profileApi } from '../api/profile.api';
import { SessionStorage } from '../storage/SessionStorage';
import { User } from '../models/User';

export const ProfileService = {
  getCurrentProfile: async (): Promise<User> => {
    const user = await profileApi.getCurrentProfile();
    await SessionStorage.saveUserSession(user);
    return user;
  },

  updateProfile: async (profileData: Partial<User>): Promise<User> => {
    const user = await profileApi.updateProfile(profileData);
    await SessionStorage.saveUserSession(user);
    return user;
  },
};
