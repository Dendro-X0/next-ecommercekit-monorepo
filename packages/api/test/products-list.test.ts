import { Hono } from "hono"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { ZodError } from "zod"

// Mock the DB layer used by the route
vi.mock("@repo/db", () => {
  const repo = {
    list: vi.fn(async () => ({ items: [], total: 0, page: 1, pageSize: 20 }) as const),
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

describe("Products list endpoint validation", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("returns 400 for invalid page and pageSize values", async () => {
    const app = createApp()

    const pageZero = await app.request("/api/v1/products?page=0")
    expect(pageZero.status).toBe(400)

    const pageNeg = await app.request("/api/v1/products?page=-1")
    expect(pageNeg.status).toBe(400)

    const sizeZero = await app.request("/api/v1/products?pageSize=0")
    expect(sizeZero.status).toBe(400)

    const sizeTooBig = await app.request("/api/v1/products?pageSize=101")
    expect(sizeTooBig.status).toBe(400)
  })

  it("returns 400 for invalid sort enum", async () => {
    const app = createApp()
    const res = await app.request("/api/v1/products?sort=unknown")
    expect(res.status).toBe(400)
  })

  it("applies defaults when params are absent", async () => {
    const app = createApp()
    vi.mocked(productsRepo.list).mockResolvedValueOnce({
      items: [],
      total: 0,
      page: 1,
      pageSize: 20,
    })
    const res = await app.request("/api/v1/products")
    expect(res.status).toBe(200)
    expect(vi.mocked(productsRepo.list)).toHaveBeenCalledWith({
      query: undefined,
      category: undefined,
      sort: "newest",
      page: 1,
      pageSize: 20,
      featured: undefined,
    })
  })

  it("coerces and forwards valid query parameters", async () => {
    const app = createApp()
    vi.mocked(productsRepo.list).mockResolvedValueOnce({
      items: [],
      total: 0,
      page: 2,
      pageSize: 10,
    })
    const url =
      "/api/v1/products?query=shirt&category=tops&sort=price_desc&page=2&pageSize=10&featured=true"
    const res = await app.request(url)
    expect(res.status).toBe(200)
    expect(vi.mocked(productsRepo.list)).toHaveBeenCalledWith({
      query: "shirt",
      category: "tops",
      sort: "price_desc",
      page: 2,
      pageSize: 10,
      featured: true,
    })
  })
})
