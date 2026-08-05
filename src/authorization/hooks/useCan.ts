import { useAuthStore } from '../../auth/store/authStore';
import { hasPermission } from '../utils/hasPermission';
import { hasAnyPermission } from '../utils/hasAnyPermission';
import { hasAllPermissions } from '../utils/hasAllPermissions';

export const useCan = () => {
  const user = useAuthStore((state) => state.user);

  return {
    can: (permission: string) => hasPermission(user, permission),
    canAny: (permissions: string[]) => hasAnyPermission(user, permissions),
    canAll: (permissions: string[]) => hasAllPermissions(user, permissions),
  };
};
