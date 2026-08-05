import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { tenantApi } from '../api/tenant.api';
import { SaaSSettings, TenantCreateRequest, TenantUpdateRequest } from '../models/Tenant';
import Toast from 'react-native-toast-message';
import { settingsApi } from '../api/settings.api';

export const useTenantsQuery = (params: {
  page: number;
  pageSize: number;
  search?: string;
  status?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}) => {
  // Map our UI status 'all' to empty string for API parameter if needed
  const apiParams = {
    ...params,
    status: params.status === 'all' ? undefined : params.status,
    search: params.search === '' ? undefined : params.search,
  };

  return useQuery({
    queryKey: ['tenants', apiParams],
    queryFn: () => tenantApi.getTenants(apiParams),
  });
};

export const useTenantDetailQuery = (id: string | number) => {
  return useQuery({
    queryKey: ['tenant', id],
    queryFn: () => tenantApi.getTenantById(id),
    enabled: !!id,
  });
};

export const useCreateTenantMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: TenantCreateRequest) => tenantApi.createTenant(data),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['tenants'] });
      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: response.message || 'Tenant created successfully!',
      });
    },
    onError: (err: any) => {
      const errMsg = err.response?.data?.message || err.message || 'Failed to create tenant';
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: errMsg,
      });
    },
  });
};

export const useUpdateTenantMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string | number; data: TenantUpdateRequest }) =>
      tenantApi.updateTenant(id, data),
    onSuccess: (response, variables) => {
      queryClient.invalidateQueries({ queryKey: ['tenants'] });
      queryClient.invalidateQueries({ queryKey: ['tenant', variables.id] });
      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: response.message || 'Tenant updated successfully!',
      });
    },
    onError: (err: any) => {
      const errMsg = err.response?.data?.message || err.message || 'Failed to update tenant';
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: errMsg,
      });
    },
  });
};

export const useDeleteTenantMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string | number) => tenantApi.deleteTenant(id),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['tenants'] });
      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: response.message || 'Tenant deleted successfully.',
      });
    },
    onError: (err: any) => {
      const errMsg = err.response?.data?.message || err.message || 'Failed to delete tenant';
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: errMsg,
      });
    },
  });
};

export const useActivateTenantMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string | number) => tenantApi.activateTenant(id),
    onSuccess: (response, id) => {
      queryClient.invalidateQueries({ queryKey: ['tenants'] });
      queryClient.invalidateQueries({ queryKey: ['tenant', id] });
      Toast.show({
        type: 'success',
        text1: 'Activated',
        text2: response.message || 'Tenant workspace activated!',
      });
    },
    onError: (err: any) => {
      const errMsg = err.response?.data?.message || err.message || 'Failed to activate tenant';
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: errMsg,
      });
    },
  });
};

export const useSuspendTenantMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, reason }: { id: string | number; reason: string }) =>
      tenantApi.suspendTenant(id, reason),
    onSuccess: (response, variables) => {
      queryClient.invalidateQueries({ queryKey: ['tenants'] });
      queryClient.invalidateQueries({ queryKey: ['tenant', variables.id] });
      Toast.show({
        type: 'success',
        text1: 'Suspended',
        text2: response.message || 'Tenant workspace suspended.',
      });
    },
    onError: (err: any) => {
      const errMsg = err.response?.data?.message || err.message || 'Failed to suspend tenant';
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: errMsg,
      });
    },
  });
};

export const useLockTenantMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string | number) => tenantApi.lockTenant(id),
    onSuccess: (response, id) => {
      queryClient.invalidateQueries({ queryKey: ['tenants'] });
      queryClient.invalidateQueries({ queryKey: ['tenant', id] });
      Toast.show({
        type: 'success',
        text1: 'Locked',
        text2: response.message || 'Tenant workspace locked.',
      });
    },
    onError: (err: any) => {
      const errMsg = err.response?.data?.message || err.message || 'Failed to lock tenant';
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: errMsg,
      });
    },
  });
};

export const useUnlockTenantMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string | number) => tenantApi.unlockTenant(id),
    onSuccess: (response, id) => {
      queryClient.invalidateQueries({ queryKey: ['tenants'] });
      queryClient.invalidateQueries({ queryKey: ['tenant', id] });
      Toast.show({
        type: 'success',
        text1: 'Unlocked',
        text2: response.message || 'Tenant workspace unlocked.',
      });
    },
    onError: (err: any) => {
      const errMsg = err.response?.data?.message || err.message || 'Failed to unlock tenant';
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: errMsg,
      });
    },
  });
};




export const useSettingsQuery = () => {
  return useQuery({
    queryKey: ['saas-settings'],
    queryFn: settingsApi.getSettings,
  });
};

export const useSaveSettingsMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: SaaSSettings) => settingsApi.saveSettings(data),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['saas-settings'],
      });
    },
  });
};
