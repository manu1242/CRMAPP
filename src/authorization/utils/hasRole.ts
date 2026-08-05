import { User } from '../../auth/models/User';

export const hasRole = (user: User | null, role: string): boolean => {
  if (!user || !user.role) return false;
  return user.role === role;
};
export default hasRole;
