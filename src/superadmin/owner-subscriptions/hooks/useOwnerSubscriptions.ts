import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ownerSubscriptionsApi } from '../api/ownerSubscriptions.api';
import {
  AssignOwnerSubscriptionRequest,
  OwnerSubscriptionsFilterParams,
} from '../models/ownerSubscription';
import Toast from 'react-native-toast-message';

export const useOwnerSubscriptionsQuery = (params?: OwnerSubscriptionsFilterParams) => {
  return useQuery({
    queryKey: ['ownerSubscriptions', params],
    queryFn: () => ownerSubscriptionsApi.getOwnerSubscriptions(params),
    staleTime: 60 * 1000,
  });
};

export const useOwnerSubscriptionDetailQuery = (id?: number | string) => {
  return useQuery({
    queryKey: ['ownerSubscription', id],
    queryFn: () => ownerSubscriptionsApi.getOwnerSubscriptionById(id!),
    enabled: !!id,
  });
};

export const useAssignOwnerSubscriptionMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: AssignOwnerSubscriptionRequest) =>
      ownerSubscriptionsApi.assignOwnerSubscription(data),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['ownerSubscriptions'] });
      Toast.show({
        type: 'success',
        text1: 'Subscription Assigned',
        text2: response.message || 'Owner subscription assigned successfully.',
      });
    },
    onError: (err: any) => {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2:
          err.response?.data?.message ||
          err.message ||
          'Failed to assign owner subscription.',
      });
    },
  });
};

export const useToggleOwnerSubscriptionStatusMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number | string) =>
      ownerSubscriptionsApi.toggleOwnerSubscriptionStatus(id),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['ownerSubscriptions'] });
      Toast.show({
        type: 'success',
        text1: 'Status Updated',
        text2: response.message || 'Subscription status toggled.',
      });
    },
    onError: (err: any) => {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2:
          err.response?.data?.message ||
          err.message ||
          'Failed to toggle subscription status.',
      });
    },
  });
};

export const useDeleteOwnerSubscriptionMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number | string) =>
      ownerSubscriptionsApi.deleteOwnerSubscription(id),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['ownerSubscriptions'] });
      Toast.show({
        type: 'success',
        text1: 'Deleted',
        text2: response.message || 'Owner subscription deleted.',
      });
    },
    onError: (err: any) => {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2:
          err.response?.data?.message ||
          err.message ||
          'Failed to delete owner subscription.',
      });
    },
  });
};
