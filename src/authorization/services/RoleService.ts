import { roleApi } from '../api/role.api';
import { Role } from '../models/Role';

export const RoleService = {
  getRoles: async (): Promise<Role[]> => {
    return roleApi.getRoles();
  },

  createRole: async (role: Partial<Role>): Promise<Role> => {
    return roleApi.createRole(role);
  },

  deleteRole: async (roleId: string): Promise<void> => {
    return roleApi.deleteRole(roleId);
  },
};
