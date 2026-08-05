import { useQuery } from '@tanstack/react-query';
import { dashboardService, DashboardData } from '../services/dashboardService';

export function useAdminDashboardQuery() {
  return useQuery<DashboardData, Error>({
    queryKey: ['adminDashboard'],
    queryFn: ({ signal }) => dashboardService.getDashboardData(signal),
    staleTime: 5 * 60 * 1000, // 5 minutes stale time
  });
}
