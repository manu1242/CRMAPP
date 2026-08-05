import { User } from './User';

export interface LoginResponse {
  success: boolean;
  token: string;
  user: User;
}
