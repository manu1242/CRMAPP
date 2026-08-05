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
    const params = weekStart ? { weekStart } : undefined;
    return apiClient.get<GetTasksByDateResponse>(
      API_ENDPOINTS.TASKS.GET_TASKS_BY_DATE,
      params,
      { signal }
    );
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
    return apiClient.get<GetTodayTaskNotificationsResponse>(
      API_ENDPOINTS.TASKS.GET_TODAY_NOTIFICATIONS,
      undefined,
      { signal }
    );
  },

  markTodayTasksAsRead: async (): Promise<MarkNotificationsReadResponse> => {
    return apiClient.post<MarkNotificationsReadResponse>(
      API_ENDPOINTS.TASKS.MARK_NOTIFICATIONS_READ
    );
  },
};
