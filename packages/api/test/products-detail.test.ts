import { Hono } from "hono"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { ZodError } from "zod"

// Mock the DB layer used by the route
vi.mock("@repo/db", () => {
  const repo = {
    byId: vi.fn(async (_id: string) => null as const),
    bySlug: vi.fn(async (_slug: string) => null as const),
  }
  return { productsRepo: repo } as const
})

import { productsRepo } from "@repo/db"
import productsRoute from "../src/routes/products"

function createApp(): Hono {
  const app = new Hono()
  app.onError((err, c) => {
    if (err instanceof ZodError) return c.json({ error: "Invalid request" }, 400)
    return c.json({ error: "Internal Server Error" }, 500)
  })
  app.route("/api/v1/products", productsRoute)
  return app
}

describe("Products detail endpoint validation", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("returns 400 for invalid id param (trimmed empty)", async () => {
    const app = createApp()
    const res = await app.request("/api/v1/products/id/%20") // "%20" -> " " -> trimmed -> ""
    expect(res.status).toBe(400)
  })

  it("returns 404 for non-existent id", async () => {
    const app = createApp()
    vi.mocked(productsRepo.byId).mockResolvedValueOnce(null)
    const res = await app.request("/api/v1/products/id/prod-missing")
    expect(res.status).toBe(404)
  })

  it("returns 200 with product for existing id", async () => {
    const app = createApp()
    vi.mocked(productsRepo.byId).mockResolvedValueOnce({
      id: "p1",
      slug: "shirt-1",
      name: "Shirt",
      price: 1999,
      currency: "USD",
      featured: false,
    })
    const res = await app.request("/api/v1/products/id/p1")
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body).toMatchObject({ id: "p1", slug: "shirt-1", price: 1999, currency: "USD" })
  })

  it("returns 400 for invalid slug param (trimmed empty)", async () => {
    const app = createApp()
    const res = await app.request("/api/v1/products/%20")
    expect(res.status).toBe(400)
  })

  it("returns 404 for non-existent slug", async () => {
    const app = createApp()
    vi.mocked(productsRepo.bySlug).mockResolvedValueOnce(null)
    const res = await app.request("/api/v1/products/missing-slug")
    expect(res.status).toBe(404)
  })

  it("returns 200 with product for existing slug", async () => {
    const app = createApp()
    vi.mocked(productsRepo.bySlug).mockResolvedValueOnce({
      id: "p2",
      slug: "jeans-2",
      name: "Jeans",
      price: 4999,
      currency: "USD",
      featured: true,
      imageUrl: "/img/jeans.jpg",
    })
    const res = await app.request("/api/v1/products/jeans-2")
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body).toMatchObject({ id: "p2", slug: "jeans-2", price: 4999, featured: true })
  })
})
