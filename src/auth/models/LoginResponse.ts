/**
 * POST /api/login
 *
 * Success (200 OK):
 *   {
 *     success: true,
 *     data: {
 *       token: "<JWT>",
 *       user: { userId, username, email, role, channelPartnerId, tenantId, companyName, subdomain }
 *     }
 *   }
 *
 * Failure (400 Bad Request):
 *   { success: false, message: "Invalid credentials" }
 */

/** The user object returned on successful login */
export interface LoginUser {
  userId: number;
  username: string;
  email: string;
  role: string;
  channelPartnerId: number | null;
  tenantId: number;
  companyName: string;
  subdomain: string;
}

/** Full response from POST /api/login */
export interface LoginResponse {
  success: boolean;
  message?: string;
  /** Payload — present only on success */
  data?: {
    token: string;
    user: LoginUser;
  };
}

// ── Type guard ───────────────────────────────────────────────────────────────

/** Returns true when the response contains a valid token + user (success path) */
export function isLoginSuccess(
  res: LoginResponse,
): res is LoginResponse & { data: { token: string; user: LoginUser } } {
  return (
    res.success === true &&
    typeof res.data?.token === 'string' &&
    !!res.data?.user
  );
}
