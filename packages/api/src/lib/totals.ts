import { productsRepo } from "@repo/db"
import { apiEnv } from "../env"
import {
  FlatRateShippingProvider,
  type ShippingDestination,
  type ShippingItem,
} from "../providers/shipping-provider"
import { RateTaxProvider } from "../providers/tax-provider"

export type TotalsItemInput = Readonly<{ productId?: string; priceCents: number; quantity: number }>
export type TotalsDestinationInput = ShippingDestination

export type TotalsResult = Readonly<{
  subtotalCents: number
  shippingCents: number
  taxCents: number
  totalCents: number
}>

async function enrichShippingItems(
  items: readonly TotalsItemInput[],
): Promise<readonly ShippingItem[]> {
  const out: ShippingItem[] = []
  for (const it of items) {
    let kind: "digital" | "physical" | undefined
    let shippingRequired: boolean | undefined
    let weightGrams: number | undefined
    if (it.productId) {
      const p = await productsRepo.byId(it.productId)
      if (p) {
        kind = p.kind
        shippingRequired = p.shippingRequired
        weightGrams = p.weightGrams
      }
    }
    out.push({
      quantity: it.quantity,
      priceCents: it.priceCents,
      shippingRequired:
        typeof shippingRequired === "boolean" ? shippingRequired : kind !== "digital",
      weightGrams,
      kind,
    })
  }
  return out
}

export async function computeTotals(
  args: Readonly<{ items: readonly TotalsItemInput[]; destination?: TotalsDestinationInput }>,
): Promise<TotalsResult> {
  const items = args.items.filter((i) => i.quantity > 0 && i.priceCents >= 0)
  const subtotalCents: number = items.reduce((sum, it) => sum + it.priceCents * it.quantity, 0)

  const shippingProvider = new FlatRateShippingProvider({
    thresholdCents: Math.round(apiEnv.FREE_SHIPPING_THRESHOLD * 100),
    flatFeeCents: Math.round(apiEnv.FLAT_SHIPPING_FEE * 100),
  })
  const taxProvider = new RateTaxProvider({ rate: apiEnv.TAX_RATE })

  const shippingItems = await enrichShippingItems(items)
  const ship = await shippingProvider.quote({
    items: shippingItems,
    subtotalCents,
    destination: args.destination,
  })
  const tax = await taxProvider.quote({
    items: items.map((i) => ({ quantity: i.quantity, priceCents: i.priceCents })),
    subtotalCents,
    shippingCents: ship.amountCents,
  })

  const shippingCents: number = Math.max(0, ship.amountCents)
  const taxCents: number = Math.max(0, tax.amountCents)
  const totalCents: number = subtotalCents + shippingCents + taxCents
  return { subtotalCents, shippingCents, taxCents, totalCents } as const
}

export default computeTotals
