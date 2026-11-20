import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { apiClient } from '../../api/apiClient';
import { API_ENDPOINTS } from '../../api/endpoints';
import { useAuthStore } from '../../auth/store/authStore';

/* Backend: Controllers/Api/EmployeesApiController.cs (web Team Management → Employees) */
export interface EmployeeItem {
  userId: number;
  username: string;
  email?: string | null;
  phone?: string | null;
  role: string;
  isActive: boolean;
  createdDate: string;
  lastActivity?: string | null;
}

export interface EmployeesData {
  items: EmployeeItem[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
  stats: { total: number; active: number; inactive: number; customRoles: number };
  roles: string[];
}

export interface EmployeeFilters {
  search?: string;
  role?: string;
  status?: '' | 'Active' | 'Inactive';
  fromDate?: string;
  toDate?: string;
  page?: number;
  pageSize?: number;
}

export function useEmployeesQuery(filters: EmployeeFilters) {
  const user = useAuthStore((s) => s.user);
  return useQuery<EmployeesData, Error>({
    queryKey: ['teamEmployees', user?.userId, user?.tenantId, filters],
    queryFn: ({ signal }) =>
      apiClient
        .get<{ success: boolean; message: string; data: EmployeesData }>(
          API_ENDPOINTS.AGENTS.EMPLOYEES,
          {
            search: filters.search || undefined,
            role: filters.role || undefined,
            status: filters.status || undefined,
            fromDate: filters.fromDate || undefined,
            toDate: filters.toDate || undefined,
            page: filters.page ?? 1,
            pageSize: filters.pageSize ?? 20,
          },
          { signal }
        )
        .then((r) => r.data),
    enabled: !!user,
    placeholderData: keepPreviousData,
    staleTime: 2 * 60 * 1000,
  });
}
