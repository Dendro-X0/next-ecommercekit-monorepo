/**
 * useStripeConfig
 * Fetches Stripe configuration state from the server.
 */
import { type UseQueryResult, useQuery } from "@tanstack/react-query"
import { paymentsStripeApi } from "../client/stripe"

/**
 * Hook result type for Stripe config.
 */
export type StripeConfig = Readonly<{ configured: boolean }>

/**
 * React Query hook that fetches Stripe configuration once and caches it.
 */
export function useStripeConfig(): UseQueryResult<StripeConfig, Error> {
  return useQuery<StripeConfig, Error>({
    queryKey: ["payments", "stripe", "config"] as const,
    queryFn: async (): Promise<StripeConfig> => paymentsStripeApi.config(),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  })
}
