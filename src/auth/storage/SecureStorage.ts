import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const isWeb = Platform.OS === 'web';

export const SecureStorage = {
  setItem: async (key: string, value: string): Promise<void> => {
    try {
      if (isWeb) {
        localStorage.setItem(key, value);
        return;
      }

      // Dual-write to SecureStore and AsyncStorage for iOS & Android resilience
      try {
        await SecureStore.setItemAsync(key, value, {
          keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK,
        });
      } catch (secErr) {
        console.warn(`[SecureStorage] SecureStore.setItemAsync failed for ${key}, falling back to AsyncStorage:`, secErr);
      }

      await AsyncStorage.setItem(key, value);
    } catch (error) {
      console.error(`[SecureStorage] Error saving ${key}:`, error);
    }
  },

  getItem: async (key: string): Promise<string | null> => {
    try {
      if (isWeb) {
        return localStorage.getItem(key);
      }

      // 1. Try SecureStore first
      try {
        const value = await SecureStore.getItemAsync(key);
        if (value !== null && value !== undefined && value !== '') {
          return value;
        }
      } catch (secErr) {
        console.warn(`[SecureStorage] SecureStore.getItemAsync failed for ${key}, attempting AsyncStorage:`, secErr);
      }

      // 2. Fallback to AsyncStorage (handles iOS keychain permission / simulator limits)
      return await AsyncStorage.getItem(key);
    } catch (error) {
      console.error(`[SecureStorage] Error reading ${key}:`, error);
      try {
        return await AsyncStorage.getItem(key);
      } catch {
        return null;
      }
    }
  },

  removeItem: async (key: string): Promise<void> => {
    try {
      if (isWeb) {
        localStorage.removeItem(key);
        return;
      }

      try {
        await SecureStore.deleteItemAsync(key);
      } catch {}

      try {
        await AsyncStorage.removeItem(key);
      } catch {}
    } catch (error) {
      console.error(`[SecureStorage] Error removing ${key}:`, error);
    }
  },
};

