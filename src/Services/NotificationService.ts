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

  markAllAsRead: async (): Promise<{ success: boolean }> => {
    return apiClient.post<{ success: boolean }>(API_ENDPOINTS.NOTIFICATION.MARK_ALL_READ);
  },
};
