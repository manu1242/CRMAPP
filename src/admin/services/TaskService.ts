import { apiClient } from '../../api/apiClient';
import { API_ENDPOINTS } from '../../api/endpoints';
import {
  GetTasksByDateResponse,
  UpdateTaskDateRequest,
  UpdateTaskDateResponse,
  MarkTaskCompleteRequest,
  MarkTaskCompleteResponse,
  GetTodayTaskNotificationsResponse,
  MarkNotificationsReadResponse,
} from '../models/TaskTypes';

export const TaskService = {
  getTasksByDate: async (weekStart?: string, signal?: AbortSignal): Promise<GetTasksByDateResponse> => {
    const res = await apiClient.get<any>(
      API_ENDPOINTS.TASKS.GET_TASKS_BY_DATE(weekStart),
      undefined,
      { signal }
    );
    if (res?.data?.tasksByDate) return res.data;
    return res;
  },

  updateTaskDate: async (payload: UpdateTaskDateRequest): Promise<UpdateTaskDateResponse> => {
    return apiClient.post<UpdateTaskDateResponse>(
      API_ENDPOINTS.TASKS.UPDATE_TASK_DATE,
      payload
    );
  },

  markTaskComplete: async (payload: MarkTaskCompleteRequest): Promise<MarkTaskCompleteResponse> => {
    return apiClient.post<MarkTaskCompleteResponse>(
      API_ENDPOINTS.TASKS.MARK_COMPLETE,
      payload
    );
  },

  getTodayNotifications: async (signal?: AbortSignal): Promise<GetTodayTaskNotificationsResponse> => {
    const res = await apiClient.get<any>(
      API_ENDPOINTS.TASKS.GET_TODAY_NOTIFICATIONS,
      undefined,
      { signal }
    );
    if (res?.data?.tasks) return res.data;
    return res;
  },

  markTodayTasksAsRead: async (): Promise<MarkNotificationsReadResponse> => {
    return apiClient.post<MarkNotificationsReadResponse>(
      API_ENDPOINTS.TASKS.MARK_NOTIFICATIONS_READ
    );
  },
};
