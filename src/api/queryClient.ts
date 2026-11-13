import { QueryClient } from '@tanstack/react-query';

/**
 * Shared singleton QueryClient instance.
 * Allows global cache invalidation and wiping during logout/session switches.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes stale time
      gcTime: 24 * 60 * 60 * 1000, // 24 hours cache retention
      refetchOnWindowFocus: false,
      retry: (failureCount, error: any) => {
        // Do not retry 4xx errors (unauthorized, forbidden, not found)
        const status = error?.response?.status || error?.status;
        if (status && status >= 400 && status < 500) {
          return false;
        }
        return failureCount < 3;
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
  },
});

