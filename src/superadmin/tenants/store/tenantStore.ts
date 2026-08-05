import { create } from 'zustand';

interface TenantFilterState {
  search: string;
  status: string; // 'all' | 'active' | 'suspended' | 'locked'
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  page: number;
  pageSize: number;
  
  setSearch: (search: string) => void;
  setStatus: (status: string) => void;
  setSortBy: (sortBy: string) => void;
  setSortOrder: (sortOrder: 'asc' | 'desc') => void;
  setPage: (page: number) => void;
  setPageSize: (pageSize: number) => void;
  resetFilters: () => void;
}

export const useTenantFilterStore = create<TenantFilterState>((set) => ({
  search: '',
  status: 'all',
  sortBy: 'CompanyName',
  sortOrder: 'asc',
  page: 1,
  pageSize: 10,

  setSearch: (search) => set({ search, page: 1 }), // Reset to page 1 on new search
  setStatus: (status) => set({ status, page: 1 }), // Reset to page 1 on new filter
  setSortBy: (sortBy) => set({ sortBy }),
  setSortOrder: (sortOrder) => set({ sortOrder }),
  setPage: (page) => set({ page }),
  setPageSize: (pageSize) => set({ pageSize, page: 1 }),
  resetFilters: () => set({
    search: '',
    status: 'all',
    sortBy: 'CompanyName',
    sortOrder: 'asc',
    page: 1,
    pageSize: 10
  }),
}));
