export interface PagePermission {
  route: string;
  requiredRoles?: string[];
  requiredPermissions?: string[];
}
