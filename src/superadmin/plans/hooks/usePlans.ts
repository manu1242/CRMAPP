import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { plansApi } from '../api/plans.api';
import { PlanCreateRequest, PlanUpdateRequest } from '../models/Plan';
import Toast from 'react-native-toast-message';

export const usePlansQuery = () => {
  return useQuery({
    queryKey: ['plans'],
    queryFn: () => plansApi.getPlans(),
    staleTime: 5 * 60 * 1000, // cache for 5 minutes - plans rarely change
  });
};

export const usePlanDetailQuery = (id: number) => {
  return useQuery({
    queryKey: ['plan', id],
    queryFn: () => plansApi.getPlanById(id),
    enabled: !!id && id > 0,
  });
};

export const useCreatePlanMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: PlanCreateRequest) => plansApi.createPlan(data),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['plans'] });
      Toast.show({ type: 'success', text1: 'Success', text2: response.message || 'Plan created.' });
    },
    onError: (err: any) => {
      Toast.show({ type: 'error', text1: 'Error', text2: err.response?.data?.message || err.message || 'Failed to create plan.' });
    },
  });
};

export const useUpdatePlanMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: PlanUpdateRequest }) =>
      plansApi.updatePlan(id, data),
    onSuccess: (response, variables) => {
      queryClient.invalidateQueries({ queryKey: ['plans'] });
      queryClient.invalidateQueries({ queryKey: ['plan', variables.id] });
      Toast.show({ type: 'success', text1: 'Success', text2: response.message || 'Plan updated.' });
    },
    onError: (err: any) => {
      Toast.show({ type: 'error', text1: 'Error', text2: err.response?.data?.message || err.message || 'Failed to update plan.' });
    },
  });
};

export const useDeletePlanMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => plansApi.deletePlan(id),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['plans'] });
      Toast.show({ type: 'success', text1: 'Deleted', text2: response.message || 'Plan deleted.' });
    },
    onError: (err: any) => {
      Toast.show({ type: 'error', text1: 'Error', text2: err.response?.data?.message || err.message || 'Failed to delete plan.' });
    },
  });
};
