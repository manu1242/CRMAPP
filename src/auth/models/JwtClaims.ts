export interface JwtClaims {
  sub: string;             // UserId
  email: string;
  role: string;
  tenantId: string;
  channelPartnerId?: string;
  exp: number;
  iat: number;
}
