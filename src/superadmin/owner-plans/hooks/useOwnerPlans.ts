import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ownerPlansApi } from '../api/ownerPlans.api';
import { CreateOwnerPlanRequest, UpdateOwnerPlanRequest } from '../models/ownerPlan';
import Toast from 'react-native-toast-message';

export const useOwnerPlansQuery = (onlyActive?: boolean) => {
  return useQuery({
    queryKey: ['ownerPlans', { onlyActive }],
    queryFn: () => ownerPlansApi.getOwnerPlans(onlyActive),
    staleTime: 2 * 60 * 1000,
  });
};

export const useOwnerPlanDetailQuery = (id?: number | string) => {
  return useQuery({
    queryKey: ['ownerPlan', id],
    queryFn: () => ownerPlansApi.getOwnerPlanById(id!),
    enabled: !!id,
  });
};

export const useCreateOwnerPlanMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateOwnerPlanRequest) => ownerPlansApi.createOwnerPlan(data),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['ownerPlans'] });
      Toast.show({
        type: 'success',
        text1: 'Package Created',
        text2: response.message || 'Owner package created successfully.',
      });
    },
    onError: (err: any) => {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: err.response?.data?.message || err.message || 'Failed to create owner package.',
      });
    },
  });
};

export const useUpdateOwnerPlanMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number | string; data: UpdateOwnerPlanRequest }) =>
      ownerPlansApi.updateOwnerPlan(id, data),
    onSuccess: (response, variables) => {
      queryClient.invalidateQueries({ queryKey: ['ownerPlans'] });
      queryClient.invalidateQueries({ queryKey: ['ownerPlan', variables.id] });
      Toast.show({
        type: 'success',
        text1: 'Package Updated',
        text2: response.message || 'Owner package updated successfully.',
      });
    },
    onError: (err: any) => {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: err.response?.data?.message || err.message || 'Failed to update owner package.',
      });
    },
  });
};

export const useToggleOwnerPlanStatusMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number | string) => ownerPlansApi.toggleOwnerPlanStatus(id),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['ownerPlans'] });
      Toast.show({
        type: 'success',
        text1: 'Status Updated',
        text2: response.message || 'Package status toggled successfully.',
      });
    },
    onError: (err: any) => {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: err.response?.data?.message || err.message || 'Failed to toggle package status.',
      });
    },
  });
};

export const useDeleteOwnerPlanMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number | string) => ownerPlansApi.deleteOwnerPlan(id),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['ownerPlans'] });
      Toast.show({
        type: 'success',
        text1: 'Package Deleted',
        text2: response.message || 'Owner package deleted permanently.',
      });
    },
    onError: (err: any) => {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: err.response?.data?.message || err.message || 'Failed to delete package.',
      });
    },
  });
};
