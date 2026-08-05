import { useAuthStore } from '../../auth/store/authStore';
import { hasRole } from '../utils/hasRole';

export const useRole = () => {
  const user = useAuthStore((state) => state.user);
  
  const checkRole = (role: string): boolean => {
    return hasRole(user, role);
  };

  return {
    role: user?.role || null,
    hasRole: checkRole,
  };
};
