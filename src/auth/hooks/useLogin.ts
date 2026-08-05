import { useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { LoginRequest } from '../models/LoginRequest';

export const useLogin = () => {
  const loginFn = useAuthStore((state) => state.login);
  const error = useAuthStore((state) => state.error);
  const [isLoading, setIsLoading] = useState(false);

  const login = async (credentials: LoginRequest) => {
    setIsLoading(true);
    try {
      await loginFn(credentials);
      return true;
    } catch (err) {
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    login,
    isLoading,
    error,
  };
};
