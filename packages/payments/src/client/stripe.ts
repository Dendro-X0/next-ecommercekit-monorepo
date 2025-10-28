/**
 * Typed client for Stripe payments API.
 * This package centralizes client-side integrations for reuse across apps.
 */
export const paymentsStripeApi = {
  /**
   * Fetches Stripe configuration state from backend.
   * Returns { configured: boolean }.
   */
  async config(): Promise<Readonly<{ configured: boolean }>> {
    const res: Response = await fetch("/api/v1/payments/stripe/config", {
      method: "GET",
      credentials: "include",
    })
    if (!res.ok) {
      throw new Error(`Failed to fetch Stripe config (${res.status})`)
    }
    return (await res.json()) as Readonly<{ configured: boolean }>
  },

  /**
   * Creates a PaymentIntent and returns its client secret.
   * amountCents is an integer (e.g., $12.34 -> 1234).
   */
  async createIntent(
    input: Readonly<{
      amountCents: number
      currency?: string
      metadata?: Readonly<Record<string, string>>
    }>,
    opts?: Readonly<{ idempotencyKey?: string }>,
  ): Promise<Readonly<{ clientSecret: string | null }>> {
    const headers: Record<string, string> = { "Content-Type": "application/json" }
    if (opts?.idempotencyKey) headers["Idempotency-Key"] = opts.idempotencyKey
    const res: Response = await fetch("/api/v1/payments/stripe/intent", {
      method: "POST",
      headers,
      credentials: "include",
      body: JSON.stringify({
        amountCents: input.amountCents,
        currency: input.currency ?? "usd",
        metadata: input.metadata ?? {},
      }),
    })
    if (!res.ok) {
      throw new Error(`Failed to create Stripe intent (${res.status})`)
    }
    return (await res.json()) as Readonly<{ clientSecret: string | null }>
  },

  /**
   * Creates a refund for a Stripe PaymentIntent. Admin-only.
   */
  async refund(
    input: Readonly<{
      paymentRef: string
      amountCents?: number
      reason?: "duplicate" | "fraudulent" | "requested_by_customer"
    }>,
  ): Promise<Readonly<{ id: string; status: string }>> {
    const res: Response = await fetch("/api/v1/payments/stripe/refund", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        paymentRef: input.paymentRef,
        ...(input.amountCents ? { amountCents: input.amountCents } : {}),
        ...(input.reason ? { reason: input.reason } : {}),
      }),
    })
    if (!res.ok) {
      if (res.status === 401) throw new Error("Unauthorized: please sign in")
      if (res.status === 403) throw new Error("Forbidden: admin access required")
      throw new Error(`Refund failed (${res.status})`)
    }
    return (await res.json()) as Readonly<{ id: string; status: string }>
  },
} as const
