import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { TaskService } from '../services/TaskService';
import {
  GetTasksByDateResponse,
  UpdateTaskDateRequest,
  MarkTaskCompleteRequest,
} from '../models/TaskTypes';

export function useTasksQuery(weekStart?: string) {
  return useQuery<GetTasksByDateResponse, Error>({
    queryKey: ['tasks', weekStart],
    queryFn: ({ signal }) => TaskService.getTasksByDate(weekStart, signal),
    staleTime: 3 * 60 * 1000,
  });
}

export function useTodayNotificationsQuery() {
  return useQuery({
    queryKey: ['todayNotifications'],
    queryFn: ({ signal }) => TaskService.getTodayNotifications(signal),
    staleTime: 2 * 60 * 1000,
  });
}

export function useMarkTaskCompleteMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: MarkTaskCompleteRequest) => TaskService.markTaskComplete(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['todayNotifications'] });
    },
  });
}

export function useRescheduleTaskMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpdateTaskDateRequest) => TaskService.updateTaskDate(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['todayNotifications'] });
    },
  });
}
