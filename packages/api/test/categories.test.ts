import { Hono } from "hono"
import { beforeEach, describe, expect, it, vi } from "vitest"

// Mock the DB layer used by the route
vi.mock("@repo/db", () => {
  const repo = {
    list: vi.fn(async () => [] as const),
  }
  return { categoriesRepo: repo } as const
})

import { categoriesRepo } from "@repo/db"
import categoriesRoute from "../src/routes/categories"

function createApp(): Hono {
  const app = new Hono()
  app.route("/api/v1/categories", categoriesRoute)
  return app
}

describe("Categories list endpoint", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("returns 200 with items array", async () => {
    const app = createApp()
    vi.mocked(categoriesRepo.list).mockResolvedValueOnce([
      { id: "c1", slug: "tops", name: "Tops" },
      { id: "c2", slug: "bottoms", name: "Bottoms" },
    ] as any)
    const res = await app.request("/api/v1/categories")
    expect(res.status).toBe(200)
    const body = (await res.json()) as Readonly<{ items: readonly unknown[] }>
    expect(Array.isArray(body.items)).toBe(true)
    expect(vi.mocked(categoriesRepo.list)).toHaveBeenCalledTimes(1)
  })

  it("returns 500 when repo throws", async () => {
    const app = createApp()
    vi.mocked(categoriesRepo.list).mockRejectedValueOnce(new Error("db down"))
    const res = await app.request("/api/v1/categories")
    expect(res.status).toBe(500)
    const body = (await res.json()) as Readonly<{ error: string }>
    expect(typeof body.error).toBe("string")
  })
})
