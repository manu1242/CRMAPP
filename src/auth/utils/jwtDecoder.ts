import { jwtDecode } from 'jwt-decode';
import { JwtClaims } from '../models/JwtClaims';

export const jwtDecoder = (token: string): JwtClaims | null => {
  try {
    return jwtDecode<JwtClaims>(token);
  } catch (error) {
    console.error('Failed to decode JWT:', error);
    return null;
  }
};
