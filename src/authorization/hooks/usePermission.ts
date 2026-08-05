import { useAuthStore } from '../../auth/store/authStore';
import { hasPermission } from '../utils/hasPermission';

export const usePermission = () => {
  const user = useAuthStore((state) => state.user);

  const checkPermission = (permission: string): boolean => {
    return hasPermission(user, permission);
  };

  return {
    permissions: user?.permissions || [],
    hasPermission: checkPermission,
  };
};
