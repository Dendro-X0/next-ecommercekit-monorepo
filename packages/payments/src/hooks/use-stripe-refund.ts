/**
 * useStripeRefund
 * Admin-only mutation to create a refund for a PaymentIntent.
 */
import { type UseMutationResult, useMutation } from "@tanstack/react-query"
import { paymentsStripeApi } from "../client/stripe"

export type RefundInput = Readonly<{
  paymentRef: string
  amountCents?: number
  reason?: "duplicate" | "fraudulent" | "requested_by_customer"
}>

export type RefundResult = Readonly<{ id: string; status: string }>

export function useStripeRefund(): UseMutationResult<RefundResult, Error, RefundInput> {
  return useMutation<RefundResult, Error, RefundInput>({
    mutationFn: async (input: RefundInput): Promise<RefundResult> =>
      paymentsStripeApi.refund(input),
  })
}
