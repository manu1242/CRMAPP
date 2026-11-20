import { create } from 'zustand';
import { SalesPipelineStageGroup, UpdateLeadStagePayload } from '../models/SalesPipelineTypes';
import { SalesPipelineService } from '../services/SalesPipelineService';

export interface SalesPipelineFilters {
  search?: string;
  executiveId?: number;
  source?: string;
  from?: string;
  to?: string;
}

interface SalesPipelineState {
  stages: string[];
  pipelineGroups: SalesPipelineStageGroup[];
  selectedStage: string;
  isLoading: boolean;
  isUpdatingStage: boolean;
  error: string | null;
  lastFilters?: SalesPipelineFilters;

  // Actions
  fetchPipelineData: (params?: SalesPipelineFilters) => Promise<void>;
  setSelectedStage: (stage: string) => void;
  updateLeadStage: (leadId: number, newStage: string) => Promise<boolean>;
}

export const useSalesPipelineStore = create<SalesPipelineState>((set, get) => ({
  stages: [],
  pipelineGroups: [],
  selectedStage: 'New',
  isLoading: false,
  isUpdatingStage: false,
  error: null,
  lastFilters: undefined,

  fetchPipelineData: async (params?: SalesPipelineFilters) => {
    set({ isLoading: true, error: null, lastFilters: params });
    try {
      // Parallel fetch for stages and pipeline lead groups
      const [stagesRes, leadsByStageRes] = await Promise.all([
        SalesPipelineService.getStages().catch(() => null),
        SalesPipelineService.getLeadsByStage(params),
      ]);

      const groups = leadsByStageRes.success && leadsByStageRes.data ? leadsByStageRes.data : [];
      let stagesList: string[] = [];

      if (stagesRes?.success && stagesRes.data && stagesRes.data.length > 0) {
        stagesList = [...stagesRes.data];
      } else if (groups.length > 0) {
        stagesList = groups.map((g) => g.stage);
      } else {
        stagesList = [
          'New',
          'Office Meeting',
          'Site Visit Requested',
          'Site Visit Done',
          'Quotation',
          'Quotation Sent',
          'Negotiation',
          'Booked',
        ];
      }

      // Merge any stages from groups into stagesList if missing
      groups.forEach((g) => {
        if (g.stage && !stagesList.some((s) => s.toLowerCase() === g.stage.toLowerCase())) {
          stagesList.push(g.stage);
        }
      });

      // Automatically select the first stage with leads if available, otherwise default to first stage
      const currentSelected = get().selectedStage;
      const isCurrentValid = stagesList.some((s) => s.toLowerCase() === currentSelected.toLowerCase());

      let resolvedSelectedStage = currentSelected;
      if (!isCurrentValid) {
        const firstGroupWithLeads = groups.find(
          (g) => (g.count ?? g.leads?.length ?? 0) > 0
        );
        resolvedSelectedStage = firstGroupWithLeads
          ? firstGroupWithLeads.stage
          : (stagesList[0] || 'New');
      }

      set({
        stages: stagesList,
        pipelineGroups: groups,
        selectedStage: resolvedSelectedStage,
        isLoading: false,
      });
    } catch (err: any) {
      const errMsg = err.response?.data?.message || err.message || 'Failed to fetch sales pipeline data';
      set({
        pipelineGroups: [],
        isLoading: false,
        error: errMsg,
      });
    }
  },

  setSelectedStage: (stage: string) => {
    set({ selectedStage: stage });
  },

  updateLeadStage: async (leadId: number, newStage: string): Promise<boolean> => {
    set({ isUpdatingStage: true });
    try {
      const payload: UpdateLeadStagePayload = { leadId, newStage };
      const response = await SalesPipelineService.updateLeadStage(payload);
      if (response.success) {
        // Refetch updated pipeline data with preserved filters
        await get().fetchPipelineData(get().lastFilters);
        set({ isUpdatingStage: false });
        return true;
      }
      set({ isUpdatingStage: false });
      return false;
    } catch (err: any) {
      set({ isUpdatingStage: false });
      return false;
    }
  },
}));
