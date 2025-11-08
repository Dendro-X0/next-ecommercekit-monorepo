import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { paymentsPolarApi } from "../src/client/polar"

const makeFetch = <T,>(payload: T, status = 200): typeof fetch =>
  (vi.fn(async () =>
    new Response(JSON.stringify(payload), {
      status,
      headers: { "Content-Type": "application/json" },
    }),
  ) as unknown as typeof fetch)

describe("paymentsPolarApi", () => {
  const original: typeof fetch = globalThis.fetch as unknown as typeof fetch
  beforeEach(() => {
    globalThis.fetch = makeFetch({ url: "https://polar.sh/checkout/mock" }) as unknown as typeof fetch
  })
  afterEach(() => {
    globalThis.fetch = original
    vi.restoreAllMocks()
  })

  it("builds GET url with query params for product_price_id", async () => {
    const spy = vi.spyOn(globalThis, "fetch")
    const res = await paymentsPolarApi.createCheckout({ productPriceId: "price_123" })
    expect(res.url).toContain("https://polar.sh/checkout/mock")
    expect(spy).toHaveBeenCalledTimes(1)
    const url = (spy.mock.calls[0]?.[0] as string) ?? ""
    expect(url).toContain("/api/v1/payments/polar/checkout")
    expect(url).toContain("product_price_id=price_123")
  })

  it("fetches config", async () => {
    globalThis.fetch = makeFetch({ configured: true, server: "sandbox" }) as unknown as typeof fetch
    const res = await paymentsPolarApi.config()
    expect(res.configured).toBe(true)
    expect(res.server).toBe("sandbox")
  })
})
