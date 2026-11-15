export interface Permission {
  id: string;
  name: string;
  module: string;
  description?: string;
  createdAt: string;
}

export interface MyPermissionsData {
  role: string;
  isSuperAdmin: boolean;
  isAdmin: boolean;
  isManager: boolean;
  isAgent: boolean;
  isPartner: boolean;
  isCustomRole: boolean;
  channelPartnerId: number | null;
  allowedModules: string[];
  canViewAll: boolean;
  canCreateAll: boolean;
  canEditAll: boolean;
  canDeleteAll: boolean;
  canExportAll: boolean;
  pagePermissions: Record<string, Record<string, boolean>>;
}

export interface MyPermissionsResponse {
  success: boolean;
  message?: string;
  data: MyPermissionsData;
}
