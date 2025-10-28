import type { Context } from "hono"
import { Hono } from "hono"
import { z } from "zod"
import { computeTotals } from "../lib/totals"
import { validate } from "../lib/validate"

interface QuoteItemDto {
  readonly productId?: string
  readonly price: number
  readonly quantity: number
}
interface QuoteRequestDto {
  readonly items: readonly QuoteItemDto[]
  readonly shippingAddress?: Readonly<{
    country?: string
    state?: string
    city?: string
    zipCode?: string
  }>
}
interface QuoteResponseDto {
  readonly subtotal: number
  readonly shipping: number
  readonly tax: number
  readonly total: number
}

function toCents(n: number): number {
  return Math.round(n * 100)
}
function fromCents(n: number): number {
  return Math.round(n) / 100
}

// Zod schemas for request validation
const quoteItemSchema = z.object({
  productId: z.string().min(1).optional(),
  price: z.number(),
  quantity: z.number().int().positive(),
})
const quoteRequestSchema = z.object({
  items: z.array(quoteItemSchema).nonempty(),
  shippingAddress: z
    .object({
      country: z.string().optional(),
      state: z.string().optional(),
      city: z.string().optional(),
      zipCode: z.string().optional(),
    })
    .partial()
    .optional(),
})
type QuoteRequest = Readonly<z.infer<typeof quoteRequestSchema>>

const route = new Hono().post("/quote", async (c: Context) => {
  const body: QuoteRequest = await validate.body(c, quoteRequestSchema)
  const itemsInput = body.items.map((it) => ({
    productId: it.productId,
    priceCents: toCents(it.price),
    quantity: it.quantity,
  }))
  const destination = body.shippingAddress
    ? {
        country: body.shippingAddress.country,
        state: body.shippingAddress.state,
        city: body.shippingAddress.city,
        zipCode: body.shippingAddress.zipCode,
      }
    : undefined
  const totals = await computeTotals({ items: itemsInput, destination })
  const out: QuoteResponseDto = {
    subtotal: fromCents(totals.subtotalCents),
    shipping: fromCents(totals.shippingCents),
    tax: fromCents(totals.taxCents),
    total: fromCents(totals.totalCents),
  }
  return c.json(out, 200)
})

export default route
