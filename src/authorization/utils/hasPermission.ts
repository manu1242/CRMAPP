import { User } from '../../auth/models/User';

export const hasPermission = (user: User | null, permission: string): boolean => {
  if (!user || !user.permissions) return false;
  return (user.permissions || []).includes(permission);
};
export default hasPermission;
