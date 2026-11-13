import { useQuery } from '@tanstack/react-query';
import { superAdminDashboardApi, SuperAdminDashboardData } from '../api/dashboard.api';

export const SUPERADMIN_DASHBOARD_KEYS = {
  all: ['superadmin-dashboard'] as const,
};

export const useSuperAdminDashboardQuery = () => {
  return useQuery<SuperAdminDashboardData, Error>({
    queryKey: SUPERADMIN_DASHBOARD_KEYS.all,
    queryFn: () => superAdminDashboardApi.getDashboard(),
    staleTime: 2 * 60 * 1000, // 2 minutes fresh cache
    gcTime: 30 * 60 * 1000,   // 30 minutes garbage collection
    refetchOnWindowFocus: false,
  });
};

