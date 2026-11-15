import { apiClient } from '../../api/apiClient';
import { API_ENDPOINTS } from '../../api/endpoints';
import { Permission, MyPermissionsResponse } from '../models/Permission';

export const permissionApi = {
  getMyPermissions: async (): Promise<MyPermissionsResponse> => {
    return apiClient.get<MyPermissionsResponse>(API_ENDPOINTS.AUTHORIZATION.MY_PERMISSIONS);
  },

  getRolePermissions: async (roleName: string): Promise<Permission[]> => {
    return apiClient.get<Permission[]>(API_ENDPOINTS.AUTHORIZATION.ROLE_PERMISSIONS, { roleName });
  },

  saveRolePermissions: async (roleName: string, permissions: Record<string, any>): Promise<void> => {
    return apiClient.post<void>(API_ENDPOINTS.AUTHORIZATION.SAVE_PERMISSIONS, { roleName, ...permissions });
  },
};
