/**
 * usePaypalOrder
 * Mutations to create and capture PayPal orders.
 */
import { type UseMutationResult, useMutation } from "@tanstack/react-query"
import { paymentsPaypalApi } from "../client/paypal"

export type CreateOrderInput = Readonly<{ amountCents: number; currency?: string }>
export type CreateOrderResult = Readonly<{ id: string; approveUrl: string | null }>

export type CaptureOrderInput = Readonly<{ orderId: string }>
export type CaptureOrderResult = Readonly<{ id: string; status: string | undefined }>

export function usePaypalCreateOrder(): UseMutationResult<
  CreateOrderResult,
  Error,
  CreateOrderInput
> {
  return useMutation<CreateOrderResult, Error, CreateOrderInput>({
    mutationFn: async (input: CreateOrderInput): Promise<CreateOrderResult> =>
      paymentsPaypalApi.createOrder(input),
  })
}

export function usePaypalCapture(): UseMutationResult<
  CaptureOrderResult,
  Error,
  CaptureOrderInput
> {
  return useMutation<CaptureOrderResult, Error, CaptureOrderInput>({
    mutationFn: async (input: CaptureOrderInput): Promise<CaptureOrderResult> =>
      paymentsPaypalApi.capture(input),
  })
}
