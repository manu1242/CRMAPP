import { User } from '../models/User';

export const authHelpers = {
  getFullName: (user: User | null): string => {
    if (!user) return '';
    return user.username || user.email;
  },

  getInitials: (user: User | null): string => {
    if (!user) return '';
    const initial = user.username?.[0] || user.email?.[0] || '';
    return initial.toUpperCase();
  },

  hasRole: (user: User | null, role: string): boolean => {
    if (!user || !user.role) return false;
    return user.role === role;
  },

  hasPermission: (user: User | null, permission: string): boolean => {
    if (!user || !user.permissions) return false;
    return (user.permissions || []).includes(permission);
  },
};
