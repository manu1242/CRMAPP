import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { publicLeadsApi } from '../api/publicLeads.api';
import { PublicLeadsFilterParams } from '../models/publicLead';
import Toast from 'react-native-toast-message';

export const usePublicLeadsQuery = (params?: PublicLeadsFilterParams) => {
  return useQuery({
    queryKey: ['publicLeads', params],
    queryFn: () => publicLeadsApi.getPublicLeads(params),
    staleTime: 60 * 1000,
  });
};

export const usePublicLeadStatsQuery = () => {
  return useQuery({
    queryKey: ['publicLeadStats'],
    queryFn: () => publicLeadsApi.getPublicLeadStats(),
    staleTime: 60 * 1000,
  });
};

export const usePublicLeadDetailQuery = (id?: number | string) => {
  return useQuery({
    queryKey: ['publicLeadDetail', id],
    queryFn: () => publicLeadsApi.getPublicLeadById(id!),
    enabled: !!id,
  });
};

export const useDeletePublicLeadMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number | string) => publicLeadsApi.deletePublicLead(id),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['publicLeads'] });
      queryClient.invalidateQueries({ queryKey: ['publicLeadStats'] });
      Toast.show({
        type: 'success',
        text1: 'Deleted',
        text2: response.message || 'Public lead deleted successfully.',
      });
    },
    onError: (err: any) => {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2:
          err.response?.data?.message ||
          err.message ||
          'Failed to delete public lead.',
      });
    },
  });
};

export const useBulkDeletePublicLeadsMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (leadIds: number[]) => publicLeadsApi.bulkDeletePublicLeads(leadIds),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['publicLeads'] });
      queryClient.invalidateQueries({ queryKey: ['publicLeadStats'] });
      Toast.show({
        type: 'success',
        text1: 'Bulk Deleted',
        text2: response.message || `${response.data?.deletedCount || 'Selected'} leads deleted.`,
      });
    },
    onError: (err: any) => {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2:
          err.response?.data?.message ||
          err.message ||
          'Failed to perform bulk delete.',
      });
    },
  });
};
