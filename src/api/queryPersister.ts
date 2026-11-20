import AsyncStorage from '@react-native-async-storage/async-storage';
import { QueryClient } from '@tanstack/react-query';

const CACHE_KEY = 'CRM_QUERY_CACHE_V1';
const MAX_ITEM_SIZE_BYTES = 20 * 1024; // 20 KB per query
const MAX_TOTAL_SIZE_BYTES = 200 * 1024; // 200 KB total
const SAVE_DEBOUNCE_MS = 2000; // Debounce disk writes

let saveTimeout: ReturnType<typeof setTimeout> | null = null;

export interface PersistedQueryData {
  timestamp: number;
  queries: Array<{
    queryKey: readonly unknown[];
    data: unknown;
    /** When this query's data was fetched (ms epoch). Optional for snapshots written by older builds. */
    updatedAt?: number;
  }>;
}

/**
 * Persists selected lightweight, non-sensitive TanStack Query cache entries to AsyncStorage.
 * Prevents SQLite disk full errors by applying debouncing, strict size caps, and filtering.
 */
export const QueryPersister = {
  saveCache: (queryClient: QueryClient): void => {
    if (saveTimeout) {
      clearTimeout(saveTimeout);
    }

    saveTimeout = setTimeout(async () => {
      try {
        const cache = queryClient.getQueryCache();
        const queriesToPersist: PersistedQueryData['queries'] = [];
        let currentTotalSize = 0;

        const allQueries = cache.getAll();
        for (const query of allQueries) {
          // Skip queries that failed or have no data
          if (query.state.status !== 'success' || query.state.data === undefined || query.state.data === null) {
            continue;
          }

          const keyStr = JSON.stringify(query.queryKey).toLowerCase();
          // Exclude sensitive, volatile, and heavy queries (images, files, blobs, passwords, tokens)
          if (
            keyStr.includes('token') ||
            keyStr.includes('password') ||
            keyStr.includes('auth') ||
            keyStr.includes('image') ||
            keyStr.includes('document') ||
            keyStr.includes('file') ||
            keyStr.includes('download') ||
            keyStr.includes('upload') ||
            keyStr.includes('blob') ||
            keyStr.includes('avatar')
          ) {
            continue;
          }

          try {
            const serializedData = JSON.stringify(query.state.data);
            const itemSize = serializedData.length;

            // Skip items larger than 20 KB
            if (itemSize > MAX_ITEM_SIZE_BYTES) {
              continue;
            }

            // Stop if total size exceeds limit
            if (currentTotalSize + itemSize > MAX_TOTAL_SIZE_BYTES) {
              break;
            }

            currentTotalSize += itemSize;
            queriesToPersist.push({
              queryKey: query.queryKey,
              data: query.state.data,
              updatedAt: query.state.dataUpdatedAt,
            });
          } catch {
            // Skip non-serializable items
          }
        }

        if (queriesToPersist.length === 0) return;

        const payload: PersistedQueryData = {
          timestamp: Date.now(),
          queries: queriesToPersist,
        };

        await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(payload));
      } catch (err: any) {
        // Handle SQLite Full error gracefully by pruning cache
        if (err?.message?.includes('SQLITE_FULL') || err?.code === 13) {
          AsyncStorage.removeItem(CACHE_KEY).catch(() => {});
        }
      }
    }, SAVE_DEBOUNCE_MS);
  },

  restoreCache: async (queryClient: QueryClient): Promise<void> => {
    try {
      const storedStr = await AsyncStorage.getItem(CACHE_KEY);
      if (!storedStr) return;

      const payload: PersistedQueryData = JSON.parse(storedStr);
      // Expire cache older than 12 hours
      if (Date.now() - payload.timestamp > 12 * 60 * 60 * 1000) {
        await AsyncStorage.removeItem(CACHE_KEY);
        return;
      }

      payload.queries.forEach(({ queryKey, data, updatedAt }) => {
        // Older snapshots have no per-query time; the save time is the newest it can be.
        const fetchedAt = updatedAt && updatedAt > 0 ? updatedAt : payload.timestamp;

        // Never overwrite data fetched after this snapshot (restore runs async at startup).
        const existingUpdatedAt = queryClient.getQueryState(queryKey)?.dataUpdatedAt ?? 0;
        if (existingUpdatedAt >= fetchedAt) return;

        // Stamp with the original fetch time so staleTime is measured from when the data was
        // actually fetched. Without this, restored data looks "fresh now" and is not refetched on mount.
        queryClient.setQueryData(queryKey, data, { updatedAt: fetchedAt });
      });
    } catch {
      AsyncStorage.removeItem(CACHE_KEY).catch(() => {});
    }
  },

  clearCache: async (): Promise<void> => {
    try {
      await AsyncStorage.removeItem(CACHE_KEY);
    } catch {
      // Silently ignore
    }
  },
};
