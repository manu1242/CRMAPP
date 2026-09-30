import { apiClient } from '../api/apiClient';
import { API_ENDPOINTS } from '../api/endpoints';
import { NotificationItem, TodayTaskItem } from '../authorization/models/Notification';

export interface NotificationResponse {
  success: boolean;
  count: number;
  unreadCount: number;
  taskCount: number;
  totalCount: number;
  notifications: NotificationItem[];
  tasks: TodayTaskItem[];
  message?: string;
}

export interface UnreadCountResponse {
  totalCount: number;
  unreadCount: number;
  taskCount: number;
}

export const NotificationService = {
  getNotifications: async (): Promise<NotificationResponse> => {
    const rawRes = await apiClient.get<any>(API_ENDPOINTS.NOTIFICATION.GET_NOTIFICATIONS);
    const data = rawRes?.data || rawRes || {};

    const rawNotifications: any[] = data.notifications || rawRes?.notifications || (Array.isArray(data) ? data : []);
    const rawTasks: any[] = data.tasks || rawRes?.tasks || [];

    const notifications: NotificationItem[] = rawNotifications.map((n: any) => ({
      ...n,
      id: n.notificationId ?? n.id,
      notificationId: n.notificationId ?? n.id,
      createdOnFormatted: n.createdOnFormatted || n.createdOn,
    }));

    const tasks: TodayTaskItem[] = rawTasks.map((t: any) => ({
      leadId: t.leadId,
      encodedId: t.encodedId,
      followUpId: t.followUpId,
      name: t.name,
      contact: t.contact,
      stage: t.stage,
      status: t.status,
      followUpTime: t.followUpTime,
      followUpDate: t.followUpDate,
    }));

    const unreadCount = data.unreadCount ?? rawRes?.unreadCount ?? notifications.filter((n) => !n.isRead).length;
    const taskCount = data.taskCount ?? tasks.length;
    const totalCount = data.totalCount ?? notifications.length;

    return {
      success: rawRes?.success ?? true,
      count: unreadCount,
      unreadCount,
      taskCount,
      totalCount,
      notifications,
      tasks,
      message: rawRes?.message,
    };
  },

  getUnreadCount: async (): Promise<UnreadCountResponse> => {
    try {
      const rawRes = await apiClient.get<any>(API_ENDPOINTS.NOTIFICATION.GET_UNREAD_COUNT);
      const data = rawRes?.data || rawRes || {};
      return {
        totalCount: data.totalCount ?? 0,
        unreadCount: data.unreadCount ?? 0,
        taskCount: data.taskCount ?? 0,
      };
    } catch {
      return { totalCount: 0, unreadCount: 0, taskCount: 0 };
    }
  },

  markAsRead: async (notificationId: number | string): Promise<{ success: boolean }> => {
    return apiClient.post<{ success: boolean }>(
      API_ENDPOINTS.NOTIFICATION.MARK_AS_READ(notificationId),
      { notificationId: Number(notificationId) || notificationId }
    );
  },

  markAllAsRead: async (): Promise<{ success: boolean; data?: any }> => {
    return apiClient.post<{ success: boolean; data?: any }>(API_ENDPOINTS.NOTIFICATION.MARK_ALL_READ);
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

