import React from 'react';
import { useAuthStore } from '../../auth/store/authStore';

interface AuthGuardProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export const AuthGuard: React.FC<AuthGuardProps> = ({ children, fallback = null }) => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  if (!isAuthenticated) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};
export default AuthGuard;
