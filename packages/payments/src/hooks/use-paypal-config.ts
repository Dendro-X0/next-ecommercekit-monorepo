/**
 * usePaypalConfig
 * Fetches PayPal configuration state from the server.
 */
import { type UseQueryResult, useQuery } from "@tanstack/react-query"
import { type PaypalConfig, paymentsPaypalApi } from "../client/paypal"

export function usePaypalConfig(): UseQueryResult<PaypalConfig, Error> {
  return useQuery<PaypalConfig, Error>({
    queryKey: ["payments", "paypal", "config"] as const,
    queryFn: async (): Promise<PaypalConfig> => paymentsPaypalApi.config(),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  })
}
