export const ROLES = {
  ADMIN: 'ADMIN',
  MANAGER: 'MANAGER',
  USER: 'USER',
  GUEST: 'GUEST',
} as const;

export type SystemRole = typeof ROLES[keyof typeof ROLES];
