import { useQuery } from '@tanstack/react-query';
import { BrandingService, BrandingData } from '../services/BrandingService';
import { useAuthStore } from '../../auth/store/authStore';

export function useBrandingQuery() {
  const user = useAuthStore((state) => state.user);
  const isSuperAdmin = user?.role?.trim()?.toLowerCase() === 'superadmin';

  return useQuery<BrandingData, Error>({
    queryKey: ['branding', user?.tenantId],
    queryFn: ({ signal }) => BrandingService.getBranding(signal),
    enabled: !!user && !isSuperAdmin && !!user?.tenantId,
    staleTime: 10 * 60 * 1000, // 10 minutes cache
    gcTime: 24 * 60 * 60 * 1000,
  });
}
