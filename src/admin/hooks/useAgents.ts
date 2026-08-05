import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { AgentsService } from '../services/Agentservice';

// ─── Stale / GC times ────────────────────────────────────────────────────────
// Agents list is relatively stable — 5 min stale, 10 min in gc memory.
// Agent details are rarely mutated, keep longer in cache.
const AGENTS_STALE_MS  = 5 * 60 * 1000;  //  5 minutes
const AGENTS_GC_MS     = 10 * 60 * 1000; // 10 minutes
const AGENT_STALE_MS   = 5 * 60 * 1000;
const AGENT_GC_MS      = 15 * 60 * 1000;

/**
 * Hook to retrieve the paginated list of agents with optional search and filters.
 * AbortSignal is forwarded so in-flight requests are cancelled when the
 * query key changes or the component unmounts.
 */
export const useAgents = (params?: {
  search?: string;
  status?: string;
  type?: string;
  fromDate?: string;
  toDate?: string;
  page?: number;
  pageSize?: number;
}) => {
  return useQuery({
    queryKey: ['agents', params],
    queryFn: ({ signal }) => AgentsService.getAgents(params, signal),
    staleTime: AGENTS_STALE_MS,
    gcTime: AGENTS_GC_MS,
    placeholderData: keepPreviousData,
  });
};

/**
 * Hook to retrieve agent onboarding dropdown selections (types, commission rules).
 * Dropdowns change very rarely — cache aggressively.
 */
export const useAgentDropdowns = () => {
  return useQuery({
    queryKey: ['agentDropdowns'],
    queryFn: () => AgentsService.getDropdowns(),
    staleTime: 30 * 60 * 1000, // 30 minutes — dropdown options rarely change
    gcTime: 60 * 60 * 1000,    // 1 hour
  });
};

/**
 * Hook to onboard a new agent.
 */
export const useOnboardAgent = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (formData: FormData) => AgentsService.onboardAgent(formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agents'] });
    },
  });
};

/**
 * Hook to update an existing agent's details.
 */
export const useUpdateAgent = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, formData }: { id: number | string; formData: FormData }) =>
      AgentsService.updateAgent(id, formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agents'] });
    },
  });
};

/**
 * Hook to delete an agent.
 */
export const useDeleteAgent = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number | string) => AgentsService.deleteAgent(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agents'] });
    },
  });
};

/**
 * Hook to retrieve a single agent by ID.
 * Disabled when id is falsy to prevent erroneous fetches.
 */
export const useAgent = (id: number | string | undefined) => {
  return useQuery({
    queryKey: ['agent', id],
    queryFn: () => AgentsService.getAgentById(id!),
    enabled: !!id,
    staleTime: AGENT_STALE_MS,
    gcTime: AGENT_GC_MS,
  });
};

/**
 * Hook to upload an agent document.
 */
export const useUploadAgentDocument = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      agentId,
      fileUri,
      fileName,
      fileType,
      docName,
      docType,
    }: {
      agentId: number | string;
      fileUri: string;
      fileName: string;
      fileType: string;
      docName: string;
      docType: string;
    }) =>
      AgentsService.uploadDocument(agentId, fileUri, fileName, fileType, docName, docType),
    onSuccess: (_, { agentId }) => {
      queryClient.invalidateQueries({ queryKey: ['agent', String(agentId)] });
      queryClient.invalidateQueries({ queryKey: ['agent', Number(agentId)] });
      queryClient.invalidateQueries({ queryKey: ['agents'] });
    },
  });
};

/**
 * Hook to delete an agent document.
 */
export const useDeleteAgentDocument = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ agentId, documentId }: { agentId: number | string; documentId: number | string }) =>
      AgentsService.deleteDocument(documentId),
    onSuccess: (_, { agentId }) => {
      queryClient.invalidateQueries({ queryKey: ['agent', String(agentId)] });
      queryClient.invalidateQueries({ queryKey: ['agent', Number(agentId)] });
      queryClient.invalidateQueries({ queryKey: ['agents'] });
    },
  });
};
