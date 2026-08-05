import { useEffect } from 'react';
import { useAuthStore } from '../store/authStore';

export const useSession = () => {
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isLoading = useAuthStore((state) => state.isLoading);
  const error = useAuthStore((state) => state.error);
  const initializeSession = useAuthStore((state) => state.initializeSession);

  useEffect(() => {
    initializeSession();
  }, [initializeSession]);

  return {
    user,
    isAuthenticated,
    isLoading,
    error,
    refreshSession: initializeSession,
  };
};
