import { create } from 'zustand';
import { useHeaderScrollStore } from './useHeaderScrollStore';

export type DashboardTab = 'admin' | 'sales' | 'team' | 'tracking' | 'milestone';

interface DashboardTabState {
  activeTab: DashboardTab;
  setActiveTab: (tab: DashboardTab) => void;
}

export const useDashboardTabStore = create<DashboardTabState>((set) => ({
  activeTab: 'admin',
  setActiveTab: (tab: DashboardTab) => {
    set({ activeTab: tab });
    useHeaderScrollStore.getState().resetHeader();
  },
}));
