import { apiClient } from '../../api/apiClient';
import { API_ENDPOINTS } from '../../api/endpoints';

export interface RoleSummary {
  totalRoles: number;
  adminRoles: number;
  customRoles: number;
}

export interface RolePagination {
  pageNumber: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}

export interface RoleItem {
  id: number;
  roleName: string;
  allowedModules: string;
  channelPartnerId: number | null;
  accessType: string;
  statusText: string;
  createdDate: string;
}

export interface RoleManagementListResponse {
  success: boolean;
  summary: RoleSummary;
  pagination: RolePagination;
  data: RoleItem[];
}

export interface AddRolePayload {
  roleName: string;
  allowedModules?: string;
}

export interface AddRoleResponse {
  success: boolean;
  message: string;
  data?: RoleItem;
}

export interface PagePermissionItem {
  pageId: number;
  pageName: string;
  pageKey: string;
  permissions: Record<string, boolean>; // e.g. { View: true, Create: true, Edit: true, Delete: true, Export: true, "Bulk Upload": true }
}

export interface ModulePermissionGroup {
  moduleId: number;
  moduleName: string;
  pages: PagePermissionItem[];
}

export interface RolePermissionsMatrixResponse {
  success: boolean;
  roleName: string;
  channelPartnerId: number | null;
  availablePermissionTypes: string[];
  modules: ModulePermissionGroup[];
}

export interface SavePermissionEntry {
  pageId: number;
  permissionId?: number;
  permissionName?: string;
  isAllowed: boolean;
}

export interface SaveRolePermissionsPayload {
  roleName: string;
  permissions: SavePermissionEntry[];
}

export interface SaveRolePermissionsResponse {
  success: boolean;
  message: string;
  data?: {
    roleName: string;
    savedCount: number;
  };
}

export const roleManagementService = {
  /**
   * 4.1 List Roles with Summary Stats
   */
  getRoles: async (params?: {
    search?: string;
    page?: number;
    pageSize?: number;
  }): Promise<RoleManagementListResponse> => {
    return await apiClient.get<RoleManagementListResponse>(
      API_ENDPOINTS.ROLE_MANAGEMENT.LIST,
      params
    );
  },

  /**
   * 4.2 Create / Add Role
   */
  addRole: async (payload: AddRolePayload): Promise<AddRoleResponse> => {
    return await apiClient.post<AddRoleResponse>(
      API_ENDPOINTS.ROLE_MANAGEMENT.ADD,
      payload
    );
  },

  /**
   * 4.3 Get Role Permissions Matrix
   */
  getRolePermissions: async (roleName: string): Promise<RolePermissionsMatrixResponse> => {
    return await apiClient.get<RolePermissionsMatrixResponse>(
      API_ENDPOINTS.ROLE_MANAGEMENT.PERMISSIONS,
      { roleName }
    );
  },

  /**
   * 4.4 Save Role Permissions Matrix
   */
  saveRolePermissions: async (
    payload: SaveRolePermissionsPayload
  ): Promise<SaveRolePermissionsResponse> => {
    return await apiClient.post<SaveRolePermissionsResponse>(
      API_ENDPOINTS.ROLE_MANAGEMENT.PERMISSIONS,
      payload
    );
  },
};
