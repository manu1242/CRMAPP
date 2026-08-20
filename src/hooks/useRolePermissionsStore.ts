import { create } from 'zustand';
import { RolePermissionsMatrixResponse, roleManagementService } from '../admin/services/roleManagementService';

interface RolePermissionsStore {
    cache: Record<string, RolePermissionsMatrixResponse>;
    loadingRoles: Record<string, boolean>;
    fetchPermissionsForRole: (roleName: string, forceRefresh?: boolean) => Promise<RolePermissionsMatrixResponse | null>;
    updateCache: (roleName: string, matrix: RolePermissionsMatrixResponse) => void;
    clearCache: () => void;
}

export const useRolePermissionsStore = create<RolePermissionsStore>((set, get) => ({
    cache: {},
    loadingRoles: {},
    fetchPermissionsForRole: async (roleName, forceRefresh = false) => {
        const { cache, loadingRoles } = get();
        if (cache[roleName] && !forceRefresh) {
            return cache[roleName];
        }
        if (loadingRoles[roleName]) {
            return null;
        }

        set((state) => ({
            loadingRoles: { ...state.loadingRoles, [roleName]: true }
        }));

        try {
            const res = await roleManagementService.getRolePermissions(roleName);
            if (res && res.success) {
                set((state) => ({
                    cache: { ...state.cache, [roleName]: res },
                    loadingRoles: { ...state.loadingRoles, [roleName]: false }
                }));
                return res;
            }
        } catch (err) {
            console.warn('Error fetching permissions for ' + roleName, err);
        }

        set((state) => ({
            loadingRoles: { ...state.loadingRoles, [roleName]: false }
        }));
        return null;
    },
    updateCache: (roleName, matrix) => {
        set((state) => ({
            cache: { ...state.cache, [roleName]: matrix }
        }));
    },
    clearCache: () => {
        set({ cache: {}, loadingRoles: {} });
    }
}));
