import { User } from '../../auth/models/User';

export const hasAllPermissions = (user: User | null, permissions: string[]): boolean => {
  if (!user || !user.permissions) return false;
  return permissions.every((permission) => (user.permissions || []).includes(permission));
};
export default hasAllPermissions;
