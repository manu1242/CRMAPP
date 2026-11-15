import { permissionApi } from '../api/permission.api';
import { Permission, MyPermissionsData } from '../models/Permission';

export const PermissionService = {
  getMyPermissions: async (): Promise<MyPermissionsData | null> => {
    try {
      const res = await permissionApi.getMyPermissions();
      if (res && res.success && res.data) {
        return res.data;
      }
      return (res as any)?.data || (res as any) || null;
    } catch (err) {
      console.warn('[PermissionService] Failed to fetch current user permissions:', err);
      return null;
    }
  },

  getRolePermissions: async (roleName: string): Promise<Permission[]> => {
    return permissionApi.getRolePermissions(roleName);
  },

  saveRolePermissions: async (roleName: string, permissions: Record<string, any>): Promise<void> => {
    return permissionApi.saveRolePermissions(roleName, permissions);
  },
};
