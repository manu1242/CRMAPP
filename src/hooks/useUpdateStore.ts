import { create } from 'zustand';
import { otaService } from '../Services/ota/otaService';

interface UpdateState {
  isUpdateAvailable: boolean;
  isUpdateReady: boolean;
  setIsUpdateAvailable: (available: boolean) => void;
  checkUpdates: () => Promise<void>;
  downloadAndApply: () => Promise<void>;
}

export const useUpdateStore = create<UpdateState>((set) => ({
  isUpdateAvailable: otaService.getState().isUpdateAvailable,
  isUpdateReady: otaService.getState().isUpdateReady,
  setIsUpdateAvailable: (available) => set({ isUpdateAvailable: available }),
  checkUpdates: async () => {
    try {
      const result = await otaService.checkForUpdate(true);
      set({ isUpdateAvailable: result.isAvailable });
    } catch (error) {
      console.warn('[useUpdateStore] Check failed:', error);
    }
  },
  downloadAndApply: async () => {
    try {
      const res = await otaService.downloadUpdate();
      if (res.isNew) {
        await otaService.reloadApp();
      }
    } catch (error) {
      console.warn('[useUpdateStore] Download/Apply failed:', error);
    }
  },
}));

// Synchronize with OtaService changes
otaService.subscribe((state) => {
  useUpdateStore.setState({
    isUpdateAvailable: state.isUpdateAvailable,
    isUpdateReady: state.isUpdateReady,
  });
});
