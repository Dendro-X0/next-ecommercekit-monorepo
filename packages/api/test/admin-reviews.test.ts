import { Hono } from "hono"
import { beforeEach, describe, expect, it, vi } from "vitest"

// Mock the DB layer used by the route
vi.mock("@repo/db", () => {
  const repo = {
    adminList: vi.fn(),
    adminUpdateStatus: vi.fn(),
  }
  return { reviewsRepo: repo }
})

import { reviewsRepo } from "@repo/db"
import adminReviewsRoute from "../src/routes/admin-reviews"

/**
 * Build a Hono app instance with typed context variables.
 */
type Vars = Readonly<{ user: unknown | null; session: unknown | null }>

function createApp(withAdmin: boolean): Hono<{ Variables: Vars }> {
  const app = new Hono<{ Variables: Vars }>()
  if (withAdmin) {
    app.use("*", async (c, next) => {
      c.set("user", { email: "admin@example.com", isAdmin: true })
      await next()
    })
  }
  app.route("/api/v1/admin/reviews", adminReviewsRoute)
  return app
}

describe("Admin Reviews API", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("denies access when unauthenticated", async () => {
    const app = createApp(false)
    const res = await app.request("/api/v1/admin/reviews")
    expect(res.status).toBe(401)
  })

  it("forbids access for non-admin user", async () => {
    const app = new Hono<{ Variables: Vars }>()
    app.use("*", async (c, next) => {
      c.set("user", { email: "user@example.com" })
      await next()
    })
    app.route("/api/v1/admin/reviews", adminReviewsRoute)
    const res = await app.request("/api/v1/admin/reviews")
    expect(res.status).toBe(403)
  })

  it("lists reviews with filters applied", async () => {
    const app = createApp(true)
    vi.mocked(reviewsRepo).adminList.mockResolvedValueOnce([
      {
        id: "rv-1",
        userId: "u-1",
        productId: "prod-1",
        rating: 5,
        title: "Great!",
        content: "Loved it",
        status: "Pending",
        createdAt: new Date("2024-04-01T00:00:00Z").toISOString(),
        updatedAt: new Date("2024-04-01T00:00:00Z").toISOString(),
      },
    ])

    const res = await app.request("/api/v1/admin/reviews?status=Pending&limit=10")
    expect(res.status).toBe(200)
    const body = (await res.json()) as Readonly<{ items: readonly any[] }>
    expect(vi.mocked(reviewsRepo).adminList).toHaveBeenCalledWith({ status: "Pending", limit: 10 })
    expect(Array.isArray(body.items)).toBe(true)
    expect(body.items[0]).toMatchObject({
      id: "rv-1",
      status: "Pending",
      productId: "prod-1",
      rating: 5,
    })
    expect(typeof body.items[0].createdAt).toBe("string")
    expect(typeof body.items[0].updatedAt).toBe("string")
  })

  it("updates review status to Published", async () => {
    const app = createApp(true)
    vi.mocked(reviewsRepo).adminUpdateStatus.mockResolvedValueOnce({
      id: "rv-2",
      userId: "u-2",
      productId: "prod-2",
      rating: 4,
      title: null,
      content: null,
      status: "Published",
      createdAt: new Date("2024-05-01T00:00:00Z").toISOString(),
      updatedAt: new Date("2024-05-02T00:00:00Z").toISOString(),
    })

    const res = await app.request("/api/v1/admin/reviews/rv-2/status", {
      method: "PATCH",
      body: JSON.stringify({ status: "Published" }),
      headers: { "Content-Type": "application/json" },
    })
    expect(res.status).toBe(200)
    expect(vi.mocked(reviewsRepo).adminUpdateStatus).toHaveBeenCalledWith("rv-2", "Published")
    const body = await res.json()
    expect(body.status).toBe("Published")
  })

  it("updates review status to Rejected", async () => {
    const app = createApp(true)
    vi.mocked(reviewsRepo).adminUpdateStatus.mockResolvedValueOnce({
      id: "rv-3",
      userId: null,
      productId: "prod-3",
      rating: 2,
      title: "meh",
      content: "not good",
      status: "Rejected",
      createdAt: new Date("2024-05-03T00:00:00Z").toISOString(),
      updatedAt: new Date("2024-05-03T12:00:00Z").toISOString(),
    })

    const res = await app.request("/api/v1/admin/reviews/rv-3/status", {
      method: "PATCH",
      body: JSON.stringify({ status: "Rejected" }),
      headers: { "Content-Type": "application/json" },
    })
    expect(res.status).toBe(200)
    expect(vi.mocked(reviewsRepo).adminUpdateStatus).toHaveBeenCalledWith("rv-3", "Rejected")
    const body = await res.json()
    expect(body.status).toBe("Rejected")
  })
})
