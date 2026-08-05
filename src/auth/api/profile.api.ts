import { apiClient } from '../../api/apiClient';
import { API_ENDPOINTS } from '../../api/endpoints';
import { User } from '../models/User';

interface ProfileApiResponse {
  success: boolean;
  data: User;
}

export const profileApi = {
  /**
   * GET /api/v1/profile
   * The backend wraps the user in { success: true, data: { ... } }.
   * We unwrap .data so callers always receive a flat User object with
   * userId, username, role, etc. at the top level.
   * This is critical for stopImpersonation() — if we returned the wrapper
   * the auth store's user.role would be undefined, causing "Unauthorized"
   * errors on every route change after stopping impersonation.
   */
  getCurrentProfile: async (): Promise<User> => {
    const res = await apiClient.get<ProfileApiResponse>(API_ENDPOINTS.PROFILE.ME);
    // Unwrap { success, data } → User
    return (res as any)?.data ?? (res as any);
  },

  updateProfile: async (profileData: Partial<User>): Promise<User> => {
    const res = await apiClient.put<ProfileApiResponse>(API_ENDPOINTS.PROFILE.UPDATE, profileData);
    return (res as any)?.data ?? (res as any);
  },
};
