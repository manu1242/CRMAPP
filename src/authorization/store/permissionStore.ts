import { create } from 'zustand';
import { Permission } from '../models/Permission';
import { PermissionService } from '../services/PermissionService';

interface PermissionState {
  permissions: Permission[];
  isLoading: boolean;
  error: string | null;
  fetchPermissions: (roleName: string) => Promise<void>;
}

export const usePermissionStore = create<PermissionState>((set) => ({
  permissions: [],
  isLoading: false,
  error: null,

  fetchPermissions: async (roleName: string) => {
    set({ isLoading: true, error: null });
    try {
      const permissions = await PermissionService.getRolePermissions(roleName);
      set({ permissions, isLoading: false });
    } catch (err: any) {
      set({ error: err.message || 'Failed to fetch permissions', isLoading: false });
    }
  },
}));
