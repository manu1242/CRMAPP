import { JwtClaims } from '../models/JwtClaims';
import { jwtDecoder } from '../utils/jwtDecoder';

export const JwtService = {
  decodeToken: (token: string): JwtClaims | null => {
    return jwtDecoder(token);
  },

  isTokenExpired: (token: string): boolean => {
    const claims = jwtDecoder(token);
    if (!claims) return true;
    
    // Check if expiration time is reached (exp is in seconds, Date.now() is in ms)
    const currentTime = Math.floor(Date.now() / 1000);
    return claims.exp < currentTime;
  },
};
