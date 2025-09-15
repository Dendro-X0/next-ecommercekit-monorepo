import { Hono } from "hono"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { ZodError } from "zod"

// Mock the DB layer used by the route
vi.mock("@repo/db", () => {
  const repo = {
    list: vi.fn(
      async (_args: Readonly<{ query?: string; limit: number; page: number }>) => [] as const,
    ),
  }
  return { customersRepo: repo } as const
})

import { customersRepo } from "@repo/db"
import adminCustomersRoute from "../src/routes/admin-customers"

type CustomerItem = Readonly<{
  id: string
  name: string
  email: string
  imageUrl?: string | null
  createdAt: string
  ordersCount: number
  totalSpentCents: number
  status: "Active" | "Inactive" | "VIP"
}>

function createApp(
  userKind: "none" | "user" | "admin",
): Hono<{ Variables: Readonly<{ user: unknown | null }> }> {
  const app = new Hono<{ Variables: Readonly<{ user: unknown | null }> }>()
  app.onError((err, c) => {
    if (err instanceof ZodError) return c.json({ error: "Invalid request" }, 400)
    return c.json({ error: "Internal Server Error" }, 500)
  })
  if (userKind !== "none") {
    app.use("*", async (c, next) => {
      if (userKind === "admin") c.set("user", { email: "admin@example.com", isAdmin: true })
      else c.set("user", { email: "user@example.com" })
      await next()
    })
  }
  app.route("/api/v1/admin/customers", adminCustomersRoute)
  return app
}

describe("Admin Customers list validation & guards", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("GET denies unauthenticated", async () => {
    const app = createApp("none")
    const res = await app.request("/api/v1/admin/customers")
    expect(res.status).toBe(401)
  })

  it("GET forbids non-admin", async () => {
    const app = createApp("user")
    const res = await app.request("/api/v1/admin/customers")
    expect(res.status).toBe(403)
  })

  it("returns 400 for invalid query params", async () => {
    const app = createApp("admin")
    const bad1 = await app.request("/api/v1/admin/customers?limit=0")
    expect(bad1.status).toBe(400)
    const bad2 = await app.request("/api/v1/admin/customers?page=-1")
    expect(bad2.status).toBe(400)
    const bad3 = await app.request("/api/v1/admin/customers?limit=201")
    expect(bad3.status).toBe(400)
    const bad4 = await app.request("/api/v1/admin/customers?limit=abc")
    expect(bad4.status).toBe(400)
    const bad5 = await app.request("/api/v1/admin/customers?query=")
    expect(bad5.status).toBe(400)
  })

  it("applies defaults and calls repo with default paging when no params", async () => {
    const app = createApp("admin")
    vi.mocked(customersRepo.list).mockResolvedValueOnce([])
    const res = await app.request("/api/v1/admin/customers")
    expect(res.status).toBe(200)
    expect(vi.mocked(customersRepo.list)).toHaveBeenCalledWith({ limit: 50, page: 1 })
  })

  it("passes through valid query, limit, and page to repo", async () => {
    const app = createApp("admin")
    vi.mocked(customersRepo.list).mockResolvedValueOnce([])
    const res = await app.request("/api/v1/admin/customers?query=olivia&limit=20&page=2")
    expect(res.status).toBe(200)
    expect(vi.mocked(customersRepo.list)).toHaveBeenCalledWith({
      query: "olivia",
      limit: 20,
      page: 2,
    })
  })

  it("trims query and forwards trimmed value to repo", async () => {
    const app = createApp("admin")
    vi.mocked(customersRepo.list).mockResolvedValueOnce([])
    const res = await app.request("/api/v1/admin/customers?query=%20%20olivia%20%20")
    expect(res.status).toBe(200)
    expect(vi.mocked(customersRepo.list)).toHaveBeenCalledWith({
      query: "olivia",
      limit: 50,
      page: 1,
    })
  })

  it("accepts boundary limit=200 and forwards", async () => {
    const app = createApp("admin")
    vi.mocked(customersRepo.list).mockResolvedValueOnce([])
    const res = await app.request("/api/v1/admin/customers?limit=200")
    expect(res.status).toBe(200)
    expect(vi.mocked(customersRepo.list)).toHaveBeenCalledWith({ limit: 200, page: 1 })
  })

  it("accepts boundary page=10000 and forwards", async () => {
    const app = createApp("admin")
    vi.mocked(customersRepo.list).mockResolvedValueOnce([])
    const res = await app.request("/api/v1/admin/customers?page=10000")
    expect(res.status).toBe(200)
    expect(vi.mocked(customersRepo.list)).toHaveBeenCalledWith({ limit: 50, page: 10000 })
  })

  it("maps output shape and preserves createdAt ISO strings", async () => {
    const app = createApp("admin")
    const now = new Date().toISOString()
    const items: ReadonlyArray<CustomerItem> = [
      {
        id: "u1",
        name: "Olivia",
        email: "olivia@example.com",
        imageUrl: null,
        createdAt: now,
        ordersCount: 3,
        totalSpentCents: 12999,
        status: "Active",
      },
      {
        id: "u2",
        name: "Liam",
        email: "liam@example.com",
        imageUrl: "https://x/y.jpg",
        createdAt: now,
        ordersCount: 0,
        totalSpentCents: 0,
        status: "Inactive",
      },
    ]
    vi.mocked(customersRepo.list).mockResolvedValueOnce(items)
    const res = await app.request("/api/v1/admin/customers")
    expect(res.status).toBe(200)
    const body = (await res.json()) as Readonly<{
      items: ReadonlyArray<
        Readonly<{
          id: string
          name: string
          email: string
          imageUrl?: string
          createdAt: string
          ordersCount: number
          totalSpentCents: number
          status: string
        }>
      >
    }>
    expect(body.items.length).toBe(2)
    expect(body.items[0]).toEqual({
      id: "u1",
      name: "Olivia",
      email: "olivia@example.com",
      createdAt: now,
      ordersCount: 3,
      totalSpentCents: 12999,
      status: "Active",
    })
    expect(body.items[1]).toEqual({
      id: "u2",
      name: "Liam",
      email: "liam@example.com",
      imageUrl: "https://x/y.jpg",
      createdAt: now,
      ordersCount: 0,
      totalSpentCents: 0,
      status: "Inactive",
    })
  })

  it("returns 500 when repo throws", async () => {
    const app = createApp("admin")
    vi.mocked(customersRepo.list).mockRejectedValueOnce(new Error("db down"))
    const res = await app.request("/api/v1/admin/customers")
    expect(res.status).toBe(500)
    const body = (await res.json()) as Readonly<{ error: string }>
    expect(typeof body.error).toBe("string")
  })

  it("returns 400 when page exceeds maximum", async () => {
    const app = createApp("admin")
    const res = await app.request("/api/v1/admin/customers?page=10001")
    expect(res.status).toBe(400)
  })

  it("returns 400 for non-integer limit", async () => {
    const app = createApp("admin")
    const res = await app.request("/api/v1/admin/customers?limit=5.5")
    expect(res.status).toBe(400)
  })

  it("returns 400 for non-numeric page", async () => {
    const app = createApp("admin")
    const res = await app.request("/api/v1/admin/customers?page=abc")
    expect(res.status).toBe(400)
  })

  it("returns 400 for whitespace-only query", async () => {
    const app = createApp("admin")
    const res = await app.request("/api/v1/admin/customers?query=%20%20")
    expect(res.status).toBe(400)
  })

  it("omits imageUrl when repo returns undefined", async () => {
    const app = createApp("admin")
    const now = new Date().toISOString()
    const items: ReadonlyArray<CustomerItem> = [
      {
        id: "u3",
        name: "Ava",
        email: "ava@example.com",
        // imageUrl omitted to simulate undefined
        createdAt: now,
        ordersCount: 1,
        totalSpentCents: 5000,
        status: "VIP",
      },
    ]
    // Cast to unknown to bypass the ts-expect-error in the array typing and feed to mock
    vi.mocked(customersRepo.list).mockResolvedValueOnce(items)
    const res = await app.request("/api/v1/admin/customers")
    expect(res.status).toBe(200)
    const body = (await res.json()) as Readonly<{ items: ReadonlyArray<Record<string, unknown>> }>
    expect(body.items[0]).toEqual({
      id: "u3",
      name: "Ava",
      email: "ava@example.com",
      createdAt: now,
      ordersCount: 1,
      totalSpentCents: 5000,
      status: "VIP",
    })
    expect(Object.hasOwn(body.items[0], "imageUrl")).toBe(false)
  })

  it("returns 400 for too-long query (>200)", async () => {
    const app = createApp("admin")
    const q = "a".repeat(201)
    const res = await app.request(`/api/v1/admin/customers?query=${q}`)
    expect(res.status).toBe(400)
  })
})
