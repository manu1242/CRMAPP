import { useQuery } from '@tanstack/react-query';
import {
  dashboardService,
  DashboardData,
  RecentActivitiesData,
  FollowUpItem,
} from '../services/dashboardService';
import { useAuthStore } from '../../auth/store/authStore';

export function useAdminDashboardQuery() {
  const user = useAuthStore((state) => state.user);
  const isSuperAdmin = user?.role?.trim()?.toLowerCase() === 'superadmin';

  return useQuery({
    queryKey: ['adminDashboard', user?.userId, user?.tenantId],
    queryFn: ({ signal }) => dashboardService.getDashboardData(signal),
    enabled: !!user && !isSuperAdmin,
    staleTime: 5 * 60 * 1000, // 5 minutes stale time
  });
}

export function useRecentActivitiesQuery() {
  const user = useAuthStore((state) => state.user);
  const isSuperAdmin = user?.role?.trim()?.toLowerCase() === 'superadmin';

  return useQuery({
    queryKey: ['dashboardRecentActivities', user?.userId, user?.tenantId],
    queryFn: ({ signal }) => dashboardService.getRecentActivities(signal),
    enabled: !!user && !isSuperAdmin,
    staleTime: 2 * 60 * 1000,
  });
}

export function useFollowUpsQuery() {
  const user = useAuthStore((state) => state.user);
  const isSuperAdmin = user?.role?.trim()?.toLowerCase() === 'superadmin';

  return useQuery({
    queryKey: ['dashboardFollowUps', user?.userId, user?.tenantId],
    queryFn: ({ signal }) => dashboardService.getFollowUps(signal),
    enabled: !!user && !isSuperAdmin,
    staleTime: 2 * 60 * 1000,
  });
}

export function useAdminAnalyticsQuery() {
  const user = useAuthStore((state) => state.user);
  const isSuperAdmin = user?.role?.trim()?.toLowerCase() === 'superadmin';

  return useQuery({
    queryKey: ['dashboardAdminAnalytics', user?.userId, user?.tenantId],
    queryFn: ({ signal }) => dashboardService.getAdminAnalytics(signal),
    enabled: !!user && !isSuperAdmin,
    staleTime: 5 * 60 * 1000,
  });
}

export function useSalesOverviewQuery() {
  const user = useAuthStore((state) => state.user);
  const isSuperAdmin = user?.role?.trim()?.toLowerCase() === 'superadmin';

  return useQuery({
    queryKey: ['dashboardSalesOverview', user?.userId, user?.tenantId],
    queryFn: ({ signal }) => dashboardService.getSalesOverview(signal),
    enabled: !!user && !isSuperAdmin,
    staleTime: 3 * 60 * 1000,
  });
}

export function useTeamDashboardQuery() {
  const user = useAuthStore((state) => state.user);
  const isSuperAdmin = user?.role?.trim()?.toLowerCase() === 'superadmin';

  return useQuery({
    queryKey: ['dashboardTeam', user?.userId, user?.tenantId],
    queryFn: ({ signal }) => dashboardService.getTeamDashboard(signal),
    enabled: !!user && !isSuperAdmin,
    staleTime: 3 * 60 * 1000,
  });
}

export function useMilestoneTrackingQuery(search?: string) {
  const user = useAuthStore((state) => state.user);
  const isSuperAdmin = user?.role?.trim()?.toLowerCase() === 'superadmin';

  return useQuery({
    queryKey: ['dashboardMilestones', user?.userId, user?.tenantId, search],
    queryFn: ({ signal }) => dashboardService.getMilestoneTracking(search, signal),
    enabled: !!user && !isSuperAdmin,
    staleTime: 2 * 60 * 1000,
  });
}
