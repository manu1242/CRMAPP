import { apiClient } from '../../api/apiClient';
import { API_ENDPOINTS } from '../../api/endpoints';

export interface UserProfileData {
  userId: number;
  username: string;
  email: string;
  role: string;
  phone: string;
  firstName?: string;
  lastName?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  avatarUrl?: string;
  hasAvatar?: boolean;
}

export interface GetProfileResponse {
  success: boolean;
  data: UserProfileData;
}

export interface EditProfilePayload {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
}

export interface EditProfileResponse {
  success: boolean;
  message: string;
  data?: UserProfileData;
}

export interface UploadAvatarPayload {
  imageBase64: string; // Base64 string or "remove"
}

export interface UploadAvatarResponse {
  success: boolean;
  message: string;
}

export interface ChangePasswordPayload {
  currentPassword?: string;
  newPassword?: string;
}

export interface ChangePasswordResponse {
  success: boolean;
  message: string;
}

export const profileService = {
  /**
   * 5.1 Get User Profile
   */
  getProfile: async (): Promise<GetProfileResponse> => {
    return await apiClient.get<GetProfileResponse>(API_ENDPOINTS.PROFILE_API.GET);
  },

  /**
   * 5.2 Edit User Profile
   */
  editProfile: async (payload: EditProfilePayload): Promise<EditProfileResponse> => {
    return await apiClient.put<EditProfileResponse>(
      API_ENDPOINTS.PROFILE_API.EDIT,
      payload
    );
  },

  /**
   * 5.3 Upload / Delete Avatar Picture
   */
  uploadAvatar: async (payload: UploadAvatarPayload): Promise<UploadAvatarResponse> => {
    return await apiClient.post<UploadAvatarResponse>(
      API_ENDPOINTS.PROFILE_API.UPLOAD_AVATAR,
      payload
    );
  },

  /**
   * 5.4 Change Password
   */
  changePassword: async (payload: ChangePasswordPayload): Promise<ChangePasswordResponse> => {
    return await apiClient.post<ChangePasswordResponse>(
      API_ENDPOINTS.PROFILE_API.CHANGE_PASSWORD,
      payload
    );
  },
};
