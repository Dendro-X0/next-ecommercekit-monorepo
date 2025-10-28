/**
 * Typed client for PayPal payments API.
 * This package centralizes client-side integrations for reuse across apps.
 */
export type PaypalConfig = Readonly<{ configured: boolean; mode: "sandbox" | "live" }>

export const paymentsPaypalApi = {
  /**
   * Fetches PayPal configuration state from backend.
   * Returns { configured: boolean, mode }.
   */
  async config(): Promise<PaypalConfig> {
    const res: Response = await fetch("/api/v1/payments/paypal/config", {
      method: "GET",
      credentials: "include",
    })
    if (!res.ok) throw new Error(`Failed to fetch PayPal config (${res.status})`)
    return (await res.json()) as PaypalConfig
  },

  /**
   * Creates a PayPal order and returns id and optional approveUrl.
   * amountCents is an integer (e.g., $12.34 -> 1234).
   */
  async createOrder(
    input: Readonly<{ amountCents: number; currency?: string }>,
  ): Promise<Readonly<{ id: string; approveUrl: string | null }>> {
    const res: Response = await fetch("/api/v1/payments/paypal/create", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        amountCents: input.amountCents,
        currency: input.currency ?? "USD",
      }),
    })
    if (!res.ok) throw new Error(`Failed to create PayPal order (${res.status})`)
    return (await res.json()) as Readonly<{ id: string; approveUrl: string | null }>
  },

  /**
   * Captures a PayPal order by id.
   */
  async capture(
    input: Readonly<{ orderId: string }>,
  ): Promise<Readonly<{ id: string; status: string | undefined }>> {
    const res: Response = await fetch("/api/v1/payments/paypal/capture", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId: input.orderId }),
    })
    if (!res.ok) throw new Error(`PayPal capture failed (${res.status})`)
    return (await res.json()) as Readonly<{ id: string; status: string | undefined }>
  },
} as const
