/**
 * Checkout API client.
 * One export per file: checkoutApi.
 */

type QuoteItem = Readonly<{ productId?: string; price: number; quantity: number }>
type QuoteRequest = Readonly<{
  items: readonly QuoteItem[]
  shippingAddress?: Readonly<{ country?: string; state?: string; city?: string; zipCode?: string }>
}>
type QuoteResponse = Readonly<{ subtotal: number; shipping: number; tax: number; total: number }>

async function asJson<T>(res: Response): Promise<T> {
  const ct: string | null = res.headers.get("content-type")
  const isJson: boolean = !!ct && ct.includes("application/json")
  const body: unknown = isJson ? await res.json() : undefined
  if (!res.ok) {
    const message: string =
      (body as { readonly message?: string })?.message ?? `Request failed (${res.status})`
    throw new Error(message)
  }
  return body as T
}

export const checkoutApi = {
  /** Request a trusted totals quote from the server. */
  quote: async (req: QuoteRequest): Promise<QuoteResponse> => {
    const res: Response = await fetch("/api/v1/checkout/quote", {
      method: "POST",
      credentials: "include",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(req),
    })
    return asJson<QuoteResponse>(res)
  },
} as const
