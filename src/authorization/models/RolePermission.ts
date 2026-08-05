import { Role } from './Role';
import { Permission } from './Permission';

export interface RolePermission {
  role: Role;
  permissions: Permission[];
}
