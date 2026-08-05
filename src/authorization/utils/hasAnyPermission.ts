import { User } from '../../auth/models/User';

export const hasAnyPermission = (user: User | null, permissions: string[]): boolean => {
  if (!user || !user.permissions) return false;
  return permissions.some((permission) => (user.permissions || []).includes(permission));
};
export default hasAnyPermission;
