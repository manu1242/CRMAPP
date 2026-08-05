import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { subscriptionsApi, AssignSubscriptionRequest } from '../api/subscriptions.api';
import Toast from 'react-native-toast-message';

export const useSubscriptionsQuery = () => {
  return useQuery({
    queryKey: ['subscriptions'],
    queryFn: () => subscriptionsApi.getSubscriptions(),
  });
};

export const useAssignSubscriptionMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: AssignSubscriptionRequest) => subscriptionsApi.assignSubscription(data),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
      queryClient.invalidateQueries({ queryKey: ['tenants'] }); // Invalidate tenants as their plans might have changed too
      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: response.message || 'Plan assigned successfully!',
      });
    },
    onError: (err: any) => {
      const errMsg = err.response?.data?.message || err.message || 'Failed to assign plan';
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: errMsg,
      });
    },
  });
};
