export interface User {
  // Core identity — populated from login response
  username: string;
  role: string;
  tenantId?: number;
  tenantName?: string;  // mapped from companyName
  subdomain?: string;
  // Extended fields — populated from /api/v1/auth/profile after login
  userId?: number;
  email?: string;
  channelPartnerId?: number | null;
  roles?: string[];
  permissions?: string[];
}
