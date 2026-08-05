import { apiClient } from '../../api/apiClient';
import { API_ENDPOINTS } from '../../api/endpoints';

export interface UserSummary {
  totalUsers: number;
  activeUsers: number;
  inactiveUsers: number;
}

export interface UserPagination {
  pageNumber: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}

export interface UserItem {
  userId: number;
  username: string;
  email: string;
  role: string;
  phone: string;
  isActive: boolean;
  status: string;
  channelPartnerId: number | null;
  createdDate: string;
  createdDateIso: string;
}

export interface UserManagementListResponse {
  success: boolean;
  summary: UserSummary;
  availableRoles: string[];
  pagination: UserPagination;
  data: UserItem[];
}

export interface CreateUserPayload {
  username: string;
  email: string;
  password?: string;
  role: string;
  phone?: string;
  isActive?: boolean;
}

export interface CreateUserResponse {
  success: boolean;
  message: string;
  data?: {
    userId: number;
    username: string;
    email: string;
    role: string;
    isActive: boolean;
  };
}

export interface ImpersonateUserResponse {
  success: boolean;
  message: string;
  data?: {
    token: string;
    expires: string;
    user: {
      userId: number;
      username: string;
      email: string;
      role: string;
    };
    impersonatedByUserId: number;
  };
}

export interface UserAttendanceRecord {
  attendanceId: number;
  date: string;
  day: number;
  dayOfWeek: string;
  status: string;
  loginTime: string | null;
  logoutTime: string | null;
  workingHours: number;
  correctionRequested: boolean;
  correctionStatus: string;
}

export interface UserAttendanceCalendarResponse {
  success: boolean;
  user: {
    userId: number;
    username: string;
    email: string;
  };
  month: string;
  year: number;
  summary: {
    workingDays: number;
    presentDays: number;
    absentDays: number;
    pendingRequests: number;
  };
  attendance: UserAttendanceRecord[];
}

export const userManagementService = {
  /**
   * 3.1 List Users with Summary Stats
   */
  getUsers: async (params?: {
    search?: string;
    roleFilter?: string;
    statusFilter?: string;
    page?: number;
    pageSize?: number;
  }): Promise<UserManagementListResponse> => {
    return await apiClient.get<UserManagementListResponse>(
      API_ENDPOINTS.USER_MANAGEMENT.LIST,
      params
    );
  },

  /**
   * 3.2 Create User
   */
  createUser: async (payload: CreateUserPayload): Promise<CreateUserResponse> => {
    return await apiClient.post<CreateUserResponse>(
      API_ENDPOINTS.USER_MANAGEMENT.CREATE,
      payload
    );
  },

  /**
   * 3.3 Impersonate User
   */
  impersonateUser: async (userId: number | string): Promise<ImpersonateUserResponse> => {
    return await apiClient.post<ImpersonateUserResponse>(
      API_ENDPOINTS.USER_MANAGEMENT.IMPERSONATE(userId)
    );
  },

  /**
   * 3.4 Get User Attendance Calendar View
   */
  getUserAttendanceCalendar: async (
    userId: number | string,
    params?: { month?: string; year?: number }
  ): Promise<UserAttendanceCalendarResponse> => {
    return await apiClient.get<UserAttendanceCalendarResponse>(
      API_ENDPOINTS.USER_MANAGEMENT.ATTENDANCE(userId),
      params
    );
  },

  /**
   * 3.5 Update User details
   */
  updateUser: async (
    userId: number | string,
    payload: {
      username: string;
      email: string;
      role: string;
      phone?: string;
      isActive: boolean;
      password?: string;
    }
  ): Promise<{ success: boolean; message: string; data?: any }> => {
    return await apiClient.put<{ success: boolean; message: string; data?: any }>(
      API_ENDPOINTS.USER_MANAGEMENT.BY_ID(userId),
      payload
    );
  },

  /**
   * 3.6 Delete (Deactivate) User
   */
  deleteUser: async (userId: number | string): Promise<{ success: boolean; message: string; data?: any }> => {
    return await apiClient.delete<{ success: boolean; message: string; data?: any }>(
      API_ENDPOINTS.USER_MANAGEMENT.BY_ID(userId)
    );
  },
};
