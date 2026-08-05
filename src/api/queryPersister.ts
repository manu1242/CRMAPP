import AsyncStorage from '@react-native-async-storage/async-storage';
import { QueryClient } from '@tanstack/react-query';

const CACHE_KEY = 'CRM_QUERY_CACHE_V1';

export interface PersistedQueryData {
  timestamp: number;
  queries: Array<{
    queryKey: readonly unknown[];
    data: unknown;
  }>;
}

/**
 * Persists selected non-sensitive TanStack Query cache entries to AsyncStorage.
 * Ensures strict security by filtering out sensitive auth/token data.
 */
export const QueryPersister = {
  saveCache: async (queryClient: QueryClient): Promise<void> => {
    try {
      const cache = queryClient.getQueryCache();
      const queriesToPersist: Array<{ queryKey: readonly unknown[]; data: unknown }> = [];

      cache.getAll().forEach((query) => {
        // Skip queries that failed or have no data
        if (query.state.status !== 'success' || query.state.data === undefined) {
          return;
        }

        const keyStr = JSON.stringify(query.queryKey);
        // Exclude sensitive queries (auth, tokens, credentials, passwords)
        if (
          keyStr.toLowerCase().includes('token') ||
          keyStr.toLowerCase().includes('password') ||
          keyStr.toLowerCase().includes('auth')
        ) {
          return;
        }

        queriesToPersist.push({
          queryKey: query.queryKey,
          data: query.state.data,
        });
      });

      const payload: PersistedQueryData = {
        timestamp: Date.now(),
        queries: queriesToPersist,
      };

      await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(payload));
    } catch (err) {
      if (__DEV__) {
        console.warn('[QueryPersister] Save error:', err);
      }
    }
  },

  restoreCache: async (queryClient: QueryClient): Promise<void> => {
    try {
      const storedStr = await AsyncStorage.getItem(CACHE_KEY);
      if (!storedStr) return;

      const payload: PersistedQueryData = JSON.parse(storedStr);
      // Expire cache older than 24 hours
      if (Date.now() - payload.timestamp > 24 * 60 * 60 * 1000) {
        await AsyncStorage.removeItem(CACHE_KEY);
        return;
      }

      payload.queries.forEach(({ queryKey, data }) => {
        queryClient.setQueryData(queryKey, data);
      });
    } catch (err) {
      if (__DEV__) {
        console.warn('[QueryPersister] Restore error:', err);
      }
    }
  },

  clearCache: async (): Promise<void> => {
    try {
      await AsyncStorage.removeItem(CACHE_KEY);
    } catch (err) {
      if (__DEV__) {
        console.warn('[QueryPersister] Clear error:', err);
      }
    }
  },
};
