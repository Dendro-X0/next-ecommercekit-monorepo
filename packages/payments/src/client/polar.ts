export type PolarCheckoutInput = Readonly<{
  productId?: string
  successUrl?: string
  metadata?: Readonly<Record<string, string>>
}>

export type PolarCheckoutResponse = Readonly<{ url: string }>

export const paymentsPolarApi = {
  async config(): Promise<Readonly<{ configured: boolean; server: "sandbox" | "production" }>> {
    const res: Response = await fetch("/api/v1/payments/polar/config", {
      method: "GET",
      credentials: "include",
    })
    if (!res.ok) throw new Error(`Failed to fetch Polar config (${res.status})`)
    return (await res.json()) as Readonly<{ configured: boolean; server: "sandbox" | "production" }>
  },

  async createCheckout(input?: PolarCheckoutInput): Promise<PolarCheckoutResponse> {
    const usp = new URLSearchParams()
    if (input?.productId) usp.set("product_id", input.productId)
    if (input?.successUrl) usp.set("success_url", input.successUrl)
    const url: string = `/api/v1/payments/polar/checkout${usp.size ? `?${usp.toString()}` : ""}`
    const res: Response = await fetch(url, { method: "GET", credentials: "include" })
    if (!res.ok) throw new Error(`Failed to create Polar checkout (${res.status})`)
    return (await res.json()) as PolarCheckoutResponse
  },
} as const
