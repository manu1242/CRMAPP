import { useState } from 'react';
import Toast from 'react-native-toast-message';
import { useAuthStore } from '../store/authStore';
import { ProfileService } from '../services/ProfileService';
import { User } from '../models/User';

export const useProfile = () => {
  const user = useAuthStore((state) => state.user);
  const setUser = useAuthStore((state) => state.setUser);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateProfile = async (profileData: Partial<User>) => {
    setIsLoading(true);
    setError(null);
    try {
      const updatedUser = await ProfileService.updateProfile(profileData);
      setUser(updatedUser);
      Toast.show({
        type: 'success',
        text1: 'Profile Updated',
        text2: 'Your profile details have been saved.',
      });
      return updatedUser;
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Failed to update profile';
      setError(msg);
      Toast.show({
        type: 'error',
        text1: 'Profile Update Failed',
        text2: msg,
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const reloadProfile = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const freshUser = await ProfileService.getCurrentProfile();
      setUser(freshUser);
      return freshUser;
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Failed to load profile';
      setError(msg);
      Toast.show({
        type: 'error',
        text1: 'Sync Failed',
        text2: msg,
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    user,
    isLoading,
    error,
    updateProfile,
    reloadProfile,
  };
};
