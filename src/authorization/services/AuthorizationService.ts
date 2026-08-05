import { useAuthStore } from '../../auth/store/authStore';

export const AuthorizationService = {
  hasRole: (role: string): boolean => {
    const user = useAuthStore.getState().user;
    if (!user || !user.role) return false;
    return user.role === role;
  },

  hasPermission: (permission: string): boolean => {
    const user = useAuthStore.getState().user;
    if (!user || !user.permissions) return false;
    return (user.permissions || []).includes(permission);
  },

  hasAnyRole: (roles: string[]): boolean => {
    const user = useAuthStore.getState().user;
    if (!user || !user.role) return false;
    return roles.includes(user.role);
  },

  hasAnyPermission: (permissions: string[]): boolean => {
    const user = useAuthStore.getState().user;
    if (!user || !user.permissions) return false;
    return permissions.some((permission) => (user.permissions || []).includes(permission));
  },
};
