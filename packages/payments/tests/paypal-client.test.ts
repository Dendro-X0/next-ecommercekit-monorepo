import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { paymentsPaypalApi } from "../src/client/paypal"

const mockFetch = (payload: unknown, status = 200): typeof fetch =>
  (vi.fn(async () =>
    new Response(JSON.stringify(payload), {
      status,
      headers: { "Content-Type": "application/json" },
    }),
  ) as unknown as typeof fetch)

describe("paymentsPaypalApi", () => {
  const original: typeof fetch = globalThis.fetch as unknown as typeof fetch
  beforeEach(() => {
    globalThis.fetch = mockFetch({ id: "O-1", approveUrl: "https://paypal.test/approve" }) as unknown as typeof fetch
  })
  afterEach(() => {
    globalThis.fetch = original
    vi.restoreAllMocks()
  })

  it("requests config", async () => {
    globalThis.fetch = mockFetch({ configured: true, mode: "sandbox" })
    const res = await paymentsPaypalApi.config()
    expect(res.configured).toBe(true)
    expect(res.mode).toBe("sandbox")
  })

  it("creates order with amount", async () => {
    const spy = vi.spyOn(globalThis, "fetch")
    await paymentsPaypalApi.createOrder({ amountCents: 2500, currency: "USD" })
    expect(spy).toHaveBeenCalledTimes(1)
    const [url, init] = spy.mock.calls[0] as [string, RequestInit]
    expect(url).toContain("/api/v1/payments/paypal/create")
    expect(init?.method).toBe("POST")
    const sent = JSON.parse(String(init?.body ?? "{}"))
    expect(sent.amountCents).toBe(2500)
  })

  it("captures order", async () => {
    globalThis.fetch = mockFetch({ id: "C-1", status: "COMPLETED" })
    const res = await paymentsPaypalApi.capture({ orderId: "O-1" })
    expect(res.id).toBe("C-1")
    expect(res.status).toBe("COMPLETED")
  })
})
