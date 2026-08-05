import React from 'react';
import { useAuthorization } from '../hooks/useAuthorization';

interface RoleGuardProps {
  role: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export const RoleGuard: React.FC<RoleGuardProps> = ({ role, children, fallback = null }) => {
  const { hasRole } = useAuthorization();

  if (!hasRole(role)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};
export default RoleGuard;
