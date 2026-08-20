import { create } from 'zustand';
import {
    userManagementService,
    UserItem,
    UserSummary,
    UserPagination,
    UserManagementListResponse
} from '../services/userManagementService';

interface UserState {
    users: UserItem[];
    summary: UserSummary | null;
    availableRoles: string[];
    isLoading: boolean;
    isRefreshing: boolean;
    error: string | null;

    // Filter state
    search: string;
    selectedRole: string;
    selectedStatus: string;
    page: number;
    pageSize: number;
    totalPages: number;

    // Actions
    fetchUsers: (isRefresh?: boolean) => Promise<void>;
    deleteUser: (userId: number | string) => Promise<boolean>;
    setSearch: (search: string) => void;
    setSelectedRole: (role: string) => void;
    setSelectedStatus: (status: string) => void;
    setPage: (page: number) => void;
    resetFilters: () => void;
}

export const useUserStore = create<UserState>((set, get) => ({
    users: [],
    summary: null,
    availableRoles: ['Admin', 'Agent', 'Partner'],
    isLoading: false,
    isRefreshing: false,
    error: null,

    search: '',
    selectedRole: 'All',
    selectedStatus: 'All',
    page: 1,
    pageSize: 10,
    totalPages: 1,

    fetchUsers: async (isRefresh = false) => {
        if (isRefresh) {
            set({ isRefreshing: true, error: null });
        } else {
            set({ isLoading: true, error: null });
        }

        const { search, selectedRole, selectedStatus, page, pageSize } = get();

        try {
            const response = await userManagementService.getUsers({
                search: search.trim() || undefined,
                roleFilter: selectedRole !== 'All' ? selectedRole : undefined,
                statusFilter: selectedStatus !== 'All' ? selectedStatus : undefined,
                page,
                pageSize,
            });

            if (response && response.success !== false) {
                set({
                    users: response.data || [],
                    summary: response.summary || null,
                    availableRoles: (response.availableRoles && response.availableRoles.length > 0)
                        ? response.availableRoles
                        : get().availableRoles,
                    totalPages: response.pagination?.totalPages || 1,
                    isLoading: false,
                    isRefreshing: false,
                });
            } else {
                set({
                    isLoading: false,
                    isRefreshing: false,
                    error: 'Failed to fetch user management data',
                });
            }
        } catch (err: any) {
            console.error('Error fetching users in store:', err);
            set({
                isLoading: false,
                isRefreshing: false,
                error: err.message || 'Error connecting to user service',
            });
        }
    },

    deleteUser: async (userId: number | string): Promise<boolean> => {
        try {
            const res = await userManagementService.deleteUser(userId);
            if (res && res.success) {
                // Refetch users automatically to update state
                await get().fetchUsers();
                return true;
            }
            return false;
        } catch (err) {
            console.error('Error deleting user in store:', err);
            return false;
        }
    },

    setSearch: (search) => {
        set({ search, page: 1 });
    },

    setSelectedRole: (selectedRole) => {
        set({ selectedRole, page: 1 });
    },

    setSelectedStatus: (selectedStatus) => {
        set({ selectedStatus, page: 1 });
    },

    setPage: (page) => {
        set({ page });
    },

    resetFilters: () => {
        set({
            search: '',
            selectedRole: 'All',
            selectedStatus: 'All',
            page: 1,
        });
    },
}));
