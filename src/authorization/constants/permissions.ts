export const PERMISSIONS = {
  USERS: {
    CREATE: 'users:create',
    READ: 'users:read',
    UPDATE: 'users:update',
    DELETE: 'users:delete',
  },
  SETTINGS: {
    READ: 'settings:read',
    UPDATE: 'settings:update',
  },
  REPORTS: {
    VIEW: 'reports:view',
    EXPORT: 'reports:export',
  },
} as const;

export type SystemPermission = 
  | typeof PERMISSIONS.USERS[keyof typeof PERMISSIONS.USERS]
  | typeof PERMISSIONS.SETTINGS[keyof typeof PERMISSIONS.SETTINGS]
  | typeof PERMISSIONS.REPORTS[keyof typeof PERMISSIONS.REPORTS];
