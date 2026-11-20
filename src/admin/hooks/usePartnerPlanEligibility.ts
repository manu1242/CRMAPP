import { usePermissions } from '../../authorization/hooks/usePermission';
import { useMyCrmPlan } from './useSubscriptionHooks';

export interface PartnerPlanEligibility {
  isEligible: boolean;
  maxPartners: number;
  isLoading: boolean;
  reason?: string;
}

/**
 * Hook to check whether the current tenant's subscription plan is eligible for
 * Channel Partner features (Partner Dashboard, Partner Team Mgmt, Partner Payouts, etc.)
 *
 * Rules:
 * - SuperAdmin is always eligible (unlimited).
 * - Tenants with MaxPartners > 0 or MaxPartners == -1 are eligible.
 * - Tenants with MaxPartners == 0 (e.g. Starter, Premium) are NOT eligible.
 */
export function usePartnerPlanEligibility(): PartnerPlanEligibility {
  const { isSuperAdmin, hasPartnerFeature, maxPartners: permMaxPartners, isLoading: permLoading } = usePermissions();
  const { data: crmPlanData, isLoading: planLoading } = useMyCrmPlan();

  if (isSuperAdmin) {
    return {
      isEligible: true,
      maxPartners: -1,
      isLoading: false,
    };
  }

  // 1. Check from CRM Plan query usage if loaded
  const planUsage = crmPlanData?.data?.usage;
  if (planUsage && typeof planUsage.maxPartners === 'number') {
    const max = planUsage.maxPartners;
    const isEligible = max > 0 || max === -1;
    return {
      isEligible,
      maxPartners: max,
      isLoading: false,
      reason: isEligible
        ? undefined
        : 'Your current plan does not include Channel Partners. Upgrade to Enterprise to enable this feature.',
    };
  }

  // 2. Fall back to permissions data from JWT / profile permissions
  if (typeof hasPartnerFeature === 'boolean') {
    return {
      isEligible: hasPartnerFeature,
      maxPartners: permMaxPartners,
      isLoading: permLoading,
      reason: hasPartnerFeature
        ? undefined
        : 'Your current plan does not include Channel Partners. Upgrade to Enterprise to enable this feature.',
    };
  }

  return {
    isEligible: false,
    maxPartners: 0,
    isLoading: permLoading || planLoading,
  };
}
