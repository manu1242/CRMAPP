import { create } from 'zustand';
import { Role } from '../models/Role';
import { RoleService } from '../services/RoleService';

interface RoleState {
  roles: Role[];
  isLoading: boolean;
  error: string | null;
  fetchRoles: () => Promise<void>;
  createRole: (role: Partial<Role>) => Promise<void>;
  deleteRole: (roleId: string) => Promise<void>;
}

export const useRoleStore = create<RoleState>((set) => ({
  roles: [],
  isLoading: false,
  error: null,

  fetchRoles: async () => {
    set({ isLoading: true, error: null });
    try {
      const roles = await RoleService.getRoles();
      set({ roles, isLoading: false });
    } catch (err: any) {
      set({ error: err.message || 'Failed to fetch roles', isLoading: false });
    }
  },

  createRole: async (roleData) => {
    set({ isLoading: true, error: null });
    try {
      const newRole = await RoleService.createRole(roleData);
      set((state) => ({ roles: [...state.roles, newRole], isLoading: false }));
    } catch (err: any) {
      set({ error: err.message || 'Failed to create role', isLoading: false });
    }
  },

  deleteRole: async (roleId) => {
    set({ isLoading: true, error: null });
    try {
      await RoleService.deleteRole(roleId);
      set((state) => ({
        roles: state.roles.filter((r) => r.id !== roleId),
        isLoading: false,
      }));
    } catch (err: any) {
      set({ error: err.message || 'Failed to delete role', isLoading: false });
    }
  },
}));
