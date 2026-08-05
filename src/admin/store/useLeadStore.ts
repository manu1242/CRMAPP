import { create } from 'zustand';
import { LeadItem, LeadQueryParams, LeadFullDetails } from '../models/LeadTypes';
import { LeadService } from '../services/LeadService';

interface LeadState {
  leads: LeadItem[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
  isLoading: boolean;
  error: string | null;

  // Selected Lead Details
  selectedLeadDetails: LeadFullDetails | null;
  isLoadingDetails: boolean;
  detailsError: string | null;

  // Filter state
  search: string;
  stage: string;
  status: string;
  executiveId: number | undefined;
  source: string;

  // Actions
  fetchLeads: (overrideParams?: LeadQueryParams) => Promise<void>;
  fetchLeadDetails: (id: number | string) => Promise<void>;
  clearLeadDetails: () => void;
  addLeadNote: (id: number | string, noteText: string) => Promise<boolean>;
  addLeadFollowUp: (id: number | string, payload: any) => Promise<boolean>;
  uploadLeadDocument: (id: number | string, formData: FormData) => Promise<boolean>;
  setSearch: (search: string) => void;
  setStage: (stage: string) => void;
  setStatus: (status: string) => void;
  setExecutiveId: (executiveId: number | undefined) => void;
  setSource: (source: string) => void;
  setPage: (page: number) => void;
  setPageSize: (pageSize: number) => void;
  resetFilters: () => void;
}

export const useLeadStore = create<LeadState>((set, get) => ({
  leads: [],
  totalCount: 0,
  pageNumber: 1,
  pageSize: 10,
  totalPages: 1,
  isLoading: false,
  error: null,

  selectedLeadDetails: null,
  isLoadingDetails: false,
  detailsError: null,

  search: '',
  stage: '',
  status: '',
  executiveId: undefined,
  source: '',

  fetchLeads: async (overrideParams) => {
    set({ isLoading: true, error: null });
    const { search, pageNumber, pageSize, stage, status, executiveId, source } = get();

    const queryParams: LeadQueryParams = {
      search: overrideParams?.search ?? (search || undefined),
      page: overrideParams?.page ?? pageNumber,
      pageSize: overrideParams?.pageSize ?? pageSize,
      stage: overrideParams?.stage ?? (stage || undefined),
      status: overrideParams?.status ?? (status || undefined),
      executiveId: overrideParams?.executiveId ?? executiveId,
      source: overrideParams?.source ?? (source || undefined),
    };

    try {
      const response = await LeadService.getLeads(queryParams);
      if (response.success && response.data) {
        set({
          leads: response.data.items || [],
          totalCount: response.data.totalCount || 0,
          pageNumber: response.data.pageNumber || 1,
          pageSize: response.data.pageSize || 10,
          totalPages: response.data.totalPages || 1,
          isLoading: false,
        });
      } else {
        set({
          leads: [],
          totalCount: 0,
          isLoading: false,
          error: response.message || 'Failed to fetch leads',
        });
      }
    } catch (err: any) {
      const errMsg = err.response?.data?.message || err.message || 'Error fetching leads';
      set({
        leads: [],
        totalCount: 0,
        isLoading: false,
        error: errMsg,
      });
    }
  },

  fetchLeadDetails: async (id: number | string) => {
    set({ isLoadingDetails: true, detailsError: null, selectedLeadDetails: null });
    try {
      const response = await LeadService.getLeadDetails(id);
      if (response.success && response.data) {
        set({
          selectedLeadDetails: response.data,
          isLoadingDetails: false,
        });
      } else {
        set({
          selectedLeadDetails: null,
          isLoadingDetails: false,
          detailsError: response.message || 'Failed to fetch lead details',
        });
      }
    } catch (err: any) {
      const errMsg = err.response?.data?.message || err.message || 'Error fetching lead details';
      set({
        selectedLeadDetails: null,
        isLoadingDetails: false,
        detailsError: errMsg,
      });
    }
  },

  clearLeadDetails: () => {
    set({ selectedLeadDetails: null, detailsError: null, isLoadingDetails: false });
  },

  addLeadNote: async (id: number | string, noteText: string): Promise<boolean> => {
    try {
      const response = await LeadService.addNote(id, { noteText });
      if (response.success) {
        await get().fetchLeadDetails(id);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  },

  addLeadFollowUp: async (id: number | string, payload: any): Promise<boolean> => {
    try {
      const response = await LeadService.addFollowUp(id, payload);
      if (response.success) {
        await get().fetchLeadDetails(id);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  },

  uploadLeadDocument: async (id: number | string, formData: FormData): Promise<boolean> => {
    try {
      const response = await LeadService.uploadDocument(id, formData);
      if (response.success) {
        await get().fetchLeadDetails(id);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  },

  setSearch: (search) => {
    set({ search, pageNumber: 1 });
  },

  setStage: (stage) => {
    set({ stage, pageNumber: 1 });
  },

  setStatus: (status) => {
    set({ status, pageNumber: 1 });
  },

  setExecutiveId: (executiveId) => {
    set({ executiveId, pageNumber: 1 });
  },

  setSource: (source) => {
    set({ source, pageNumber: 1 });
  },

  setPage: (page) => {
    set({ pageNumber: page });
    get().fetchLeads({ page });
  },

  setPageSize: (pageSize) => {
    set({ pageSize, pageNumber: 1 });
    get().fetchLeads({ pageSize, page: 1 });
  },

  resetFilters: () => {
    set({
      search: '',
      stage: '',
      status: '',
      executiveId: undefined,
      source: '',
      pageNumber: 1,
    });
    get().fetchLeads({
      search: undefined,
      stage: undefined,
      status: undefined,
      executiveId: undefined,
      source: undefined,
      page: 1,
    });
  },
}));

