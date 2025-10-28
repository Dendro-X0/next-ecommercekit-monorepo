/**
 * useStripeIntent
 * Mutation to create a PaymentIntent and return clientSecret.
 */
import { type UseMutationResult, useMutation } from "@tanstack/react-query"
import { paymentsStripeApi } from "../client/stripe"

export type CreateIntentInput = Readonly<{
  amountCents: number
  currency?: string
  metadata?: Readonly<Record<string, string>>
  idempotencyKey?: string
}>

export type CreateIntentResult = Readonly<{ clientSecret: string | null }>

export function useStripeIntent(): UseMutationResult<CreateIntentResult, Error, CreateIntentInput> {
  return useMutation<CreateIntentResult, Error, CreateIntentInput>({
    mutationFn: async (input: CreateIntentInput): Promise<CreateIntentResult> =>
      paymentsStripeApi.createIntent(
        { amountCents: input.amountCents, currency: input.currency, metadata: input.metadata },
        input.idempotencyKey ? { idempotencyKey: input.idempotencyKey } : undefined,
      ),
  })
}
