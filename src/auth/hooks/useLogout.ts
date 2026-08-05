import { useState } from 'react';
import { useAuthStore } from '../store/authStore';

export const useLogout = () => {
  const logoutFn = useAuthStore((state) => state.logout);
  const [isLoading, setIsLoading] = useState(false);

  const logout = async () => {
    setIsLoading(true);
    try {
      await logoutFn();
      return true;
    } catch (err) {
      console.error('Logout hook failed:', err);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    logout,
    isLoading,
  };
};
