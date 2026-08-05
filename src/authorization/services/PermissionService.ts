import { permissionApi } from '../api/permission.api';
import { Permission } from '../models/Permission';

export const PermissionService = {
  getRolePermissions: async (roleName: string): Promise<Permission[]> => {
    return permissionApi.getRolePermissions(roleName);
  },

  saveRolePermissions: async (roleName: string, permissions: Record<string, any>): Promise<void> => {
    return permissionApi.saveRolePermissions(roleName, permissions);
  },
};
