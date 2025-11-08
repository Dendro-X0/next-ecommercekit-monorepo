import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { paymentsStripeApi } from "../src/client/stripe"

const mockFetch = (payload: unknown, status = 200): typeof fetch =>
  (vi.fn(async () =>
    new Response(JSON.stringify(payload), {
      status,
      headers: { "Content-Type": "application/json" },
    }),
  ) as unknown as typeof fetch)

describe("paymentsStripeApi", () => {
  const original: typeof fetch = globalThis.fetch as unknown as typeof fetch
  beforeEach(() => {
    globalThis.fetch = mockFetch({ clientSecret: "sec_123" }) as unknown as typeof fetch
  })
  afterEach(() => {
    globalThis.fetch = original
    vi.restoreAllMocks()
  })

  it("requests config", async () => {
    globalThis.fetch = mockFetch({ configured: true })
    const res = await paymentsStripeApi.config()
    expect(res.configured).toBe(true)
  })

  it("creates intent with amount & currency", async () => {
    const spy = vi.spyOn(globalThis, "fetch")
    await paymentsStripeApi.createIntent({ amountCents: 1234, currency: "usd" })
    expect(spy).toHaveBeenCalledTimes(1)
    const [url, init] = spy.mock.calls[0] as [string, RequestInit]
    expect(url).toContain("/api/v1/payments/stripe/intent")
    expect(init?.method).toBe("POST")
    const sent = JSON.parse(String(init?.body ?? "{}"))
    expect(sent.amountCents).toBe(1234)
    expect(sent.currency).toBe("usd")
  })

  it("refunds", async () => {
    globalThis.fetch = mockFetch({ id: "re_1", status: "succeeded" })
    const res = await paymentsStripeApi.refund({ paymentRef: "pi_1" })
    expect(res.id).toBe("re_1")
  })
})
