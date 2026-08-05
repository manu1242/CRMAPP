import { apiClient } from '../../api/apiClient';
import { API_ENDPOINTS } from '../../api/endpoints';
import { Permission } from '../models/Permission';

export const permissionApi = {
  getRolePermissions: async (roleName: string): Promise<Permission[]> => {
    return apiClient.get<Permission[]>(API_ENDPOINTS.AUTHORIZATION.ROLE_PERMISSIONS, { roleName });
  },

  saveRolePermissions: async (roleName: string, permissions: Record<string, any>): Promise<void> => {
    return apiClient.post<void>(API_ENDPOINTS.AUTHORIZATION.SAVE_PERMISSIONS, { roleName, ...permissions });
  },
};
