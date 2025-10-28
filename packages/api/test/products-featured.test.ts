import { Hono } from "hono"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { ZodError } from "zod"

// Mock the DB layer used by the route
vi.mock("@repo/db", () => {
  const repo = {
    listFeatured: vi.fn(async (_limit: number) => [] as const),
  }
  return { productsRepo: repo } as const
})

import { productsRepo } from "@repo/db"
import productsRoute from "../src/routes/products"

/**
 * Build a Hono app instance and mount products route.
 * Attach a minimal error handler to return 400 on Zod validation errors
 * like the real app's global error handler.
 */
function createApp(): Hono {
  const app = new Hono()
  app.onError((err, c) => {
    if (err instanceof ZodError) return c.json({ error: "Invalid request" }, 400)
    return c.json({ error: "Internal Server Error" }, 500)
  })
  app.route("/api/v1/products", productsRoute)
  return app
}

describe("Products featured endpoint validation", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("returns 400 for non-numeric limit", async () => {
    const app = createApp()
    const res = await app.request("/api/v1/products/featured?limit=abc")
    expect(res.status).toBe(400)
  })

  it("returns 400 for zero, negative, and too-large limit", async () => {
    const app = createApp()

    const zero = await app.request("/api/v1/products/featured?limit=0")
    expect(zero.status).toBe(400)

    const neg = await app.request("/api/v1/products/featured?limit=-1")
    expect(neg.status).toBe(400)

    const tooLarge = await app.request("/api/v1/products/featured?limit=101")
    expect(tooLarge.status).toBe(400)
  })

  it("applies default limit when absent", async () => {
    const app = createApp()
    vi.mocked(productsRepo.listFeatured).mockResolvedValueOnce([])
    const res = await app.request("/api/v1/products/featured")
    expect(res.status).toBe(200)
    expect(vi.mocked(productsRepo.listFeatured)).toHaveBeenCalledWith(8)
  })

  it("accepts a valid limit and calls repo with it", async () => {
    const app = createApp()
    vi.mocked(productsRepo.listFeatured).mockResolvedValueOnce([])
    const res = await app.request("/api/v1/products/featured?limit=5")
    expect(res.status).toBe(200)
    expect(vi.mocked(productsRepo.listFeatured)).toHaveBeenCalledWith(5)
  })

  it("returns 500 when repo throws", async () => {
    const app = createApp()
    vi.mocked(productsRepo.listFeatured).mockRejectedValueOnce(new Error("db down"))
    const res = await app.request("/api/v1/products/featured")
    expect(res.status).toBe(500)
    const body = (await res.json()) as Readonly<{ error: string }>
    expect(typeof body.error).toBe("string")
  })
})
