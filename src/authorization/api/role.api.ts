import { apiClient } from '../../api/apiClient';
import { API_ENDPOINTS } from '../../api/endpoints';
import { Role } from '../models/Role';

export const roleApi = {
  getRoles: async (): Promise<Role[]> => {
    return apiClient.get<Role[]>(API_ENDPOINTS.AUTHORIZATION.ROLES);
  },

  createRole: async (role: Partial<Role>): Promise<Role> => {
    return apiClient.post<Role>(API_ENDPOINTS.AUTHORIZATION.ROLES, role);
  },

  deleteRole: async (roleId: string): Promise<void> => {
    return apiClient.delete<void>(`${API_ENDPOINTS.AUTHORIZATION.ROLES}/${roleId}`);
  },
};
