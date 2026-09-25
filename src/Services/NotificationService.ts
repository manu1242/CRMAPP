import { apiClient } from '../api/apiClient';
import { API_ENDPOINTS } from '../api/endpoints';
import { Notification } from '../authorization/models/Notification';

export interface NotificationResponse {
  success: boolean;
  count: number;
  notifications: Notification[];
}

export const NotificationService = {
  getNotifications: async (): Promise<NotificationResponse> => {
    return apiClient.get<NotificationResponse>(API_ENDPOINTS.NOTIFICATION.GET_NOTIFICATIONS);
  },

  markAsRead: async (notificationId: number | string): Promise<{ success: boolean }> => {
    return apiClient.post<{ success: boolean }>(API_ENDPOINTS.NOTIFICATION.MARK_AS_READ(notificationId));
  },

  markAllAsRead: async (): Promise<{ success: boolean }> => {
    return apiClient.post<{ success: boolean }>(API_ENDPOINTS.NOTIFICATION.MARK_ALL_READ);
  },

  saveDeviceToken: async (token: string): Promise<{ success: boolean; message?: string }> => {
    return apiClient.post<{ success: boolean; message?: string }>(
      API_ENDPOINTS.NOTIFICATION.API_SAVE_TOKEN,
      { token }
    );
  },

  sendTestNotification: async (title?: string, body?: string): Promise<{ success: boolean }> => {
    return apiClient.post<{ success: boolean }>(
      API_ENDPOINTS.NOTIFICATION.API_TEST_NOTIFICATION,
      { title, body }
    );
  },
};
