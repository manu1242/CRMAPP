import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import {
  getAgentLeadTracking,
  assignAgentLead,
} from '../services/AgentTrackingService';
import { AssignAgentLeadPayload } from '../models/AgentTrackingTypes';

export const AGENT_TRACKING_QUERY_KEY = 'agent-lead-tracking';

export function useAgentLeadTracking(
  executiveId?: number,
  search?: string,
  stage?: string,
  page: number = 1,
  pageSize: number = 20
) {
  return useQuery({
    queryKey: [AGENT_TRACKING_QUERY_KEY, executiveId, search, stage, page, pageSize],
    queryFn: () => getAgentLeadTracking(executiveId, search, stage, page, pageSize),
    placeholderData: keepPreviousData, // keep the list while switching agent / stage / page
    staleTime: 1000 * 60,
  });
}

export function useAssignAgentLead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: AssignAgentLeadPayload) => assignAgentLead(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [AGENT_TRACKING_QUERY_KEY] });
    },
  });
}

