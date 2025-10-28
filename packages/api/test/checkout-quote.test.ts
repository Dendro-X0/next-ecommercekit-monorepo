import { Hono } from "hono"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { ZodError } from "zod"

// Mock computeTotals to avoid depending on implementation
vi.mock("../src/lib/totals", () => {
  return {
    computeTotals: vi.fn(async () => ({
      subtotalCents: 1234,
      shippingCents: 500,
      taxCents: 100,
      totalCents: 1834,
    })),
  } as const
})

import { computeTotals } from "../src/lib/totals"
import checkoutRoute from "../src/routes/checkout"

function createApp(): Hono {
  const app = new Hono()
  app.onError((err, c) => {
    if (err instanceof ZodError) return c.json({ error: "Invalid request" }, 400)
    return c.json({ error: "Internal Server Error" }, 500)
  })
  app.route("/api/v1/checkout", checkoutRoute)
  return app
}

describe("Checkout quote endpoint validation", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("returns 400 for missing items array", async () => {
    const app = createApp()
    const res = await app.request("/api/v1/checkout/quote", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    })
    expect(res.status).toBe(400)
  })

  it("returns 400 for empty items array", async () => {
    const app = createApp()
    const res = await app.request("/api/v1/checkout/quote", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items: [] }),
    })
    expect(res.status).toBe(400)
  })

  it("returns 400 for invalid item fields", async () => {
    const app = createApp()
    const res = await app.request("/api/v1/checkout/quote", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items: [{ price: "9.99", quantity: 1 }] }), // price should be number
    })
    expect(res.status).toBe(400)
  })

  it("returns 200 with computed totals for valid payload", async () => {
    const app = createApp()
    const payload = {
      items: [
        { productId: "p1", price: 12.34, quantity: 1 },
        { productId: "p2", price: 5, quantity: 1 },
      ],
      shippingAddress: { country: "US", state: "CA", zipCode: "94016" },
    } as const
    const res = await app.request("/api/v1/checkout/quote", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
    expect(res.status).toBe(200)
    const body = (await res.json()) as Readonly<{
      subtotal: number
      shipping: number
      tax: number
      total: number
    }>
    expect(body).toEqual({ subtotal: 12.34, shipping: 5, tax: 1, total: 18.34 })
    expect(vi.mocked(computeTotals)).toHaveBeenCalledTimes(1)
  })
})
