import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { IntegrationService } from '../services/IntegrationService';
import { IntegrationsData, SaveIntegrationConfigPayload } from '../models/IntegrationTypes';
import { ApiResponse } from '../models/QuoatationTypes';
import { unassignedKeys } from './useUnassignedLeads';

export const integrationKeys = { all: ['integrations'] as const };

/** Cached for 5 min — revisiting the screen shows data instantly without a refetch. */
export function useIntegrationsQuery() {
  return useQuery({
    queryKey: integrationKeys.all,
    queryFn: ({ signal }) => IntegrationService.getIntegrations(signal),
    staleTime: 5 * 60 * 1000,
  });
}

/** Runs an action; on success refreshes integrations (and lead lists when leads were added/removed). */
function useIntegrationAction<TVars>(
  fn: (vars: TVars) => Promise<ApiResponse<any>>,
  opts: { affectsLeads?: boolean } = {}
) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSuccess: (res) => {
      if (!res?.success) return;
      qc.invalidateQueries({ queryKey: integrationKeys.all });
      if (opts.affectsLeads) {
        qc.invalidateQueries({ queryKey: unassignedKeys.all });
        qc.invalidateQueries({ queryKey: ['leads'] });
      }
    },
  });
}

export const useSaveIntegrationMutation = () =>
  useIntegrationAction((p: SaveIntegrationConfigPayload) => IntegrationService.saveConfig(p));

export const useSyncIntegrationMutation = () =>
  useIntegrationAction((platform: string) => IntegrationService.syncNow(platform), { affectsLeads: true });

export const useTestSyncMutation = () =>
  useIntegrationAction((platform: string) => IntegrationService.testSync(platform), { affectsLeads: true });

export const useSyncAllMutation = () =>
  useIntegrationAction((_: void) => IntegrationService.syncAllActive(), { affectsLeads: true });

export const useClearTestLeadsMutation = () =>
  useIntegrationAction((_: void) => IntegrationService.clearTestLeads(), { affectsLeads: true });

/** Optimistic toggle — the switch flips instantly and rolls back if the server rejects it. */
export function useToggleIntegrationMutation() {
  const qc = useQueryClient();
  const setEnabled = (platform: string, enable: boolean) =>
    qc.setQueryData<ApiResponse<IntegrationsData>>(integrationKeys.all, (old) => {
      if (!old?.data) return old;
      const integrations = old.data.integrations.map((i) =>
        i.platform === platform ? { ...i, isEnabled: enable } : i
      );
      return {
        ...old,
        data: {
          ...old.data,
          integrations,
          summary: { ...old.data.summary, activePlatforms: integrations.filter((i) => i.isEnabled).length },
        },
      };
    });

  return useMutation({
    mutationFn: ({ platform, enable }: { platform: string; enable: boolean }) =>
      IntegrationService.toggleIntegration(platform, enable),
    onMutate: async ({ platform, enable }) => {
      await qc.cancelQueries({ queryKey: integrationKeys.all });
      setEnabled(platform, enable);
    },
    onSuccess: (res, { platform, enable }) => {
      if (!res?.success) setEnabled(platform, !enable);
    },
    onError: (_e, { platform, enable }) => setEnabled(platform, !enable),
  });
}
