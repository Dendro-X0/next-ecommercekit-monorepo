/**
 * Shared TanStack Query client singleton.
 * One export per file: `queryClient`.
 */
import { QueryClient } from "@tanstack/react-query"

export const queryClient: QueryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      refetchOnMount: false,
      staleTime: 5 * 60_000,
      gcTime: 10 * 60_000,
    },
    mutations: {
      networkMode: "online",
    },
  },
})
