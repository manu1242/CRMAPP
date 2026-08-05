export interface User {
  userId: string;
  username: string;
  email: string;
  role: string;
  channelPartnerId?: string;
  roles?: string[];
  permissions?: string[];
}
