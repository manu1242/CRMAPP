import { useQuery } from '@tanstack/react-query';
import {
  dashboardService,
  DashboardData,
  RecentActivitiesData,
  FollowUpItem,
} from '../services/dashboardService';

export function useAdminDashboardQuery() {
  return useQuery<DashboardData, Error>({
    queryKey: ['adminDashboard'],
    queryFn: ({ signal }) => dashboardService.getDashboardData(signal),
    staleTime: 5 * 60 * 1000, // 5 minutes stale time
  });
}

export function useRecentActivitiesQuery() {
  return useQuery<RecentActivitiesData, Error>({
    queryKey: ['dashboardRecentActivities'],
    queryFn: ({ signal }) => dashboardService.getRecentActivities(signal),
    staleTime: 2 * 60 * 1000,
  });
}

export function useFollowUpsQuery() {
  return useQuery<FollowUpItem[], Error>({
    queryKey: ['dashboardFollowUps'],
    queryFn: ({ signal }) => dashboardService.getFollowUps(signal),
    staleTime: 2 * 60 * 1000,
  });
}

export function useAdminAnalyticsQuery() {
  return useQuery<any, Error>({
    queryKey: ['dashboardAdminAnalytics'],
    queryFn: ({ signal }) => dashboardService.getAdminAnalytics(signal),
    staleTime: 5 * 60 * 1000,
  });
}
