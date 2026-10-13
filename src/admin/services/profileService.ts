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

export interface DeleteAccountPayload {
  password?: string;
  reason?: string;
  confirm?: boolean;
}

export interface DeleteAccountResponse {
  success: boolean;
  message: string;
  data?: {
    userId: number;
    username: string;
    email: string;
    status: string;
    accountDeletedAt: string;
  };
  errorCode?: number;
}

export interface AccountDetailsData {
  requestId: string;
  requestedAt: string;
  exportStatus: string;
  account: {
    userId: number;
    username: string;
    email: string;
    phone: string;
    role: string;
    isActive: boolean;
    createdDate: string;
    lastActivity: string;
    tenantId: number;
    channelPartnerId: number | null;
  };
  profile: {
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber: string;
    address: string;
    city: string;
    state: string;
    country: string;
    postalCode: string;
    location: string;
    hasAvatar: boolean;
    avatarUrl: string;
  };
  security: {
    passwordLastChanged: string;
    accountDeletedAt: string | null;
    hasPushNotifications: boolean;
  };
  preferences: {
    notifications: string;
    connectedApps: string;
  };
  activitySummary: {
    agentId?: number;
    agentStatus?: string;
    assignedLeads?: number;
    [key: string]: any;
  };
  privacyNotice: string;
}

export interface AccountDetailsResponse {
  success: boolean;
  message: string;
  data: AccountDetailsData;
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

  /**
   * 5.5 Request Account Details (GDPR / Data Transparency)
   */
  getAccountDetails: async (): Promise<AccountDetailsResponse> => {
    return await apiClient.get<AccountDetailsResponse>(
      API_ENDPOINTS.PROFILE_API.ACCOUNT_DETAILS
    );
  },

  /**
   * 5.6 Delete Account (Apple App Store Guideline 5.1.1(v) & Google Play compliance)
   */
  deleteAccount: async (payload: DeleteAccountPayload): Promise<DeleteAccountResponse> => {
    return await apiClient.post<DeleteAccountResponse>(
      API_ENDPOINTS.PROFILE_API.DELETE_ACCOUNT,
      payload
    );
  },
};
