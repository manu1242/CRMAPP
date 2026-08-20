import { create } from 'zustand';
import * as Updates from 'expo-updates';

interface UpdateState {
    isUpdateAvailable: boolean;
    setIsUpdateAvailable: (available: boolean) => void;
    checkUpdates: () => Promise<void>;
}

export const useUpdateStore = create<UpdateState>((set) => ({
    isUpdateAvailable: false,
    setIsUpdateAvailable: (available) => set({ isUpdateAvailable: available }),
    checkUpdates: async () => {
        try {
            if (__DEV__) {
                // You can set this to true for testing the visual changes in development
                // set({ isUpdateAvailable: true });
                return;
            }
            const updateCheck = await Updates.checkForUpdateAsync();
            if (updateCheck.isAvailable) {
                set({ isUpdateAvailable: true });
            }
        } catch (error) {
            console.warn('Update check failed:', error);
        }
    },
}));
