import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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
    staleTime: 1000 * 30, // 30 seconds
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

