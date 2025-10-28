/**
 * Shipping provider interface and default implementation.
 * One export per file.
 */

export type ShippingDestination = Readonly<{
  country?: string
  state?: string
  city?: string
  zipCode?: string
}>

export type ShippingItem = Readonly<{
  quantity: number
  priceCents: number
  shippingRequired?: boolean
  weightGrams?: number
  kind?: "digital" | "physical"
}>

export type ShippingQuoteInput = Readonly<{
  items: readonly ShippingItem[]
  subtotalCents: number
  destination?: ShippingDestination
}>

import type { Currency } from "@repo/i18n"

export type ShippingQuote = Readonly<{ amountCents: number; currency: Currency }>

export interface ShippingProvider {
  /** Compute shipping amount in cents for given items/destination. */
  quote(input: ShippingQuoteInput): Promise<ShippingQuote>
}

/**
 * Flat-rate provider with free-shipping threshold. Uses env-configured values and ignores destination.
 */
export class FlatRateShippingProvider implements ShippingProvider {
  private readonly thresholdCents: number
  private readonly flatFeeCents: number
  public constructor(params: Readonly<{ thresholdCents: number; flatFeeCents: number }>) {
    this.thresholdCents = Math.max(0, Math.round(params.thresholdCents))
    this.flatFeeCents = Math.max(0, Math.round(params.flatFeeCents))
  }
  public async quote(input: ShippingQuoteInput): Promise<ShippingQuote> {
    const requiresShipping: boolean = input.items.some(
      (it) => it.shippingRequired !== false && it.kind !== "digital",
    )
    if (!requiresShipping) return { amountCents: 0, currency: "USD" as Currency } as const
    if (input.subtotalCents >= this.thresholdCents)
      return { amountCents: 0, currency: "USD" as Currency } as const
    return { amountCents: this.flatFeeCents, currency: "USD" as Currency } as const
  }
}

export default ShippingProvider
