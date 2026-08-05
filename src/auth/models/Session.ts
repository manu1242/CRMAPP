import { User } from './User';

export interface Session {
  id: string;
  userId: string;
  user: User;
  token: string;
  isActive: boolean;
  expiresAt: string;
  deviceInfo?: string;
  ipAddress?: string;
}
