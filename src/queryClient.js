import { QueryClient } from '@tanstack/react-query';

// Create and configure the query client
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // How long data is considered fresh (no refetch needed)
      staleTime: 5 * 60 * 1000, // 5 minutes
      
      // How long unused data stays in cache
      cacheTime: 10 * 60 * 1000, // 10 minutes
      
      // Don't refetch when window regains focus
      refetchOnWindowFocus: false,
      
      // Don't refetch when component mounts if data exists
      refetchOnMount: false,
      
      // Don't refetch when reconnecting
      refetchOnReconnect: false,
      
      // Retry failed requests once
      retry: 1,
      
      // Retry delay
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
  },
});