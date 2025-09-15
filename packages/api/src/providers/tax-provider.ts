/**
 * Tax provider interface and default implementation.
 * One export per file.
 */

export type TaxJurisdiction = Readonly<{
  country?: string
  state?: string
  city?: string
  zipCode?: string
}>

import type { Currency } from "@repo/i18n"

export type TaxItem = Readonly<{
  quantity: number
  priceCents: number
  kind?: "digital" | "physical"
}>

export type TaxQuoteInput = Readonly<{
  items: readonly TaxItem[]
  subtotalCents: number
  shippingCents: number
  jurisdiction?: TaxJurisdiction
}>

export type TaxQuote = Readonly<{ amountCents: number; currency: Currency }>

export interface TaxProvider {
  /** Compute tax amount in cents. */
  quote(input: TaxQuoteInput): Promise<TaxQuote>
}

/**
 * Percentage-of-subtotal tax provider. Does not tax shipping.
 */
export class RateTaxProvider implements TaxProvider {
  private readonly rate: number
  public constructor(params: Readonly<{ rate: number }>) {
    this.rate = Math.max(0, params.rate)
  }
  public async quote(input: TaxQuoteInput): Promise<TaxQuote> {
    const taxableBaseCents: number = input.subtotalCents
    const taxCents: number = Math.round(taxableBaseCents * this.rate)
    return { amountCents: Math.max(0, taxCents), currency: "USD" as Currency } as const
  }
}

export default TaxProvider
