import { useQuery } from '@tanstack/react-query';
import { BrandingService, BrandingData } from '../services/BrandingService';

export function useBrandingQuery() {
  return useQuery<BrandingData, Error>({
    queryKey: ['branding'],
    queryFn: ({ signal }) => BrandingService.getBranding(signal),
    staleTime: 10 * 60 * 1000, // 10 minutes cache
    gcTime: 24 * 60 * 60 * 1000,
  });
}
