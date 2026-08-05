import React from 'react';
import { useAuthorization } from '../hooks/useAuthorization';
import { PagePermission } from '../models/PagePermission';

interface ScreenGuardProps {
  policy: PagePermission;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export const ScreenGuard: React.FC<ScreenGuardProps> = ({ policy, children, fallback = null }) => {
  const { hasRole, hasPermission } = useAuthorization();

  // If roles are specified, check if user satisfies at least one
  if (policy.requiredRoles && policy.requiredRoles.length > 0) {
    const hasRequiredRole = policy.requiredRoles.some((role) => hasRole(role));
    if (!hasRequiredRole) {
      return <>{fallback}</>;
    }
  }

  // If permissions are specified, check if user satisfies at least one
  if (policy.requiredPermissions && policy.requiredPermissions.length > 0) {
    const hasRequiredPermission = policy.requiredPermissions.some((perm) => hasPermission(perm));
    if (!hasRequiredPermission) {
      return <>{fallback}</>;
    }
  }

  return <>{children}</>;
};
export default ScreenGuard;
