import { Hono } from "hono"
import { beforeEach, describe, expect, it, vi } from "vitest"

// Define module mock in factory to avoid TDZ issues
vi.mock("@repo/db", () => {
  const repo = {
    listConversionsAdmin: vi.fn(),
    getConversionById: vi.fn(),
    updateConversionStatus: vi.fn(),
    appendConversionEvent: vi.fn(),
  }
  return { affiliateRepo: repo }
})

import { affiliateRepo } from "@repo/db"
import adminAffiliateRoute from "../src/routes/admin-affiliate"

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
  app.route("/api/v1/admin/affiliate", adminAffiliateRoute)
  return app
}

describe("Admin Affiliate API", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("denies access when unauthenticated", async () => {
    const app = createApp(false)
    const res = await app.request("/api/v1/admin/affiliate/conversions")
    expect(res.status).toBe(401)
  })

  it("forbids access for non-admin user", async () => {
    const app = new Hono<{ Variables: Vars }>()
    app.use("*", async (c, next) => {
      c.set("user", { email: "user@example.com" })
      await next()
    })
    app.route("/api/v1/admin/affiliate", adminAffiliateRoute)
    const res = await app.request("/api/v1/admin/affiliate/conversions")
    expect(res.status).toBe(403)
  })

  it("lists conversions with mapping", async () => {
    const app = createApp(true)
    vi.mocked(affiliateRepo).listConversionsAdmin.mockResolvedValueOnce([
      {
        id: "cv-1",
        clickId: "clk-1",
        orderId: "ord-1",
        userId: "u-1",
        code: "alice",
        commissionCents: 700,
        status: "pending",
        createdAt: new Date("2024-01-01T00:00:00Z"),
        paidAt: null,
      },
    ])

    const res = await app.request("/api/v1/admin/affiliate/conversions?status=pending&limit=10")
    expect(res.status).toBe(200)
    const body = (await res.json()) as Readonly<{ items: readonly any[] }>
    expect(vi.mocked(affiliateRepo).listConversionsAdmin).toHaveBeenCalledWith({
      status: "pending",
      limit: 10,
    })
    expect(Array.isArray(body.items)).toBe(true)
    expect(body.items[0]).toMatchObject({
      id: "cv-1",
      clickId: "clk-1",
      orderId: "ord-1",
      userId: "u-1",
      code: "alice",
      commissionCents: 700,
      status: "pending",
    })
    expect(typeof body.items[0].createdAt).toBe("string")
    expect(body.items[0].paidAt).toBeNull()
  })

  it("updates status to approved", async () => {
    const app = createApp(true)
    vi.mocked(affiliateRepo).getConversionById.mockResolvedValueOnce({
      id: "cv-2",
      clickId: "clk-2",
      orderId: "ord-2",
      userId: "u-2",
      code: "alice",
      commissionCents: 900,
      status: "pending",
      createdAt: new Date("2024-02-01T00:00:00Z"),
      paidAt: null,
    })
    // After update, repo returns updated entity
    vi.mocked(affiliateRepo).getConversionById.mockResolvedValueOnce({
      id: "cv-2",
      clickId: "clk-2",
      orderId: "ord-2",
      userId: "u-2",
      code: "alice",
      commissionCents: 900,
      status: "approved",
      createdAt: new Date("2024-02-01T00:00:00Z"),
      paidAt: null,
    })

    const res = await createApp(true).request("/api/v1/admin/affiliate/conversions/cv-2/status", {
      method: "PATCH",
      body: JSON.stringify({ status: "approved" }),
      headers: { "Content-Type": "application/json" },
    })
    expect(res.status).toBe(200)
    expect(vi.mocked(affiliateRepo).updateConversionStatus).toHaveBeenCalledWith({
      id: "cv-2",
      status: "approved",
      paidAt: null,
    })
    expect(vi.mocked(affiliateRepo).appendConversionEvent).toHaveBeenCalledWith({
      conversionId: "cv-2",
      actorEmail: "admin@example.com",
      action: "status_change",
      fromStatus: "pending",
      toStatus: "approved",
    })
    const body = await res.json()
    expect(body.status).toBe("approved")
  })

  it("updates status to paid and sets paidAt", async () => {
    const app = createApp(true)
    vi.mocked(affiliateRepo).getConversionById.mockResolvedValueOnce({
      id: "cv-3",
      clickId: "clk-3",
      orderId: "ord-3",
      userId: "u-3",
      code: "bob",
      commissionCents: 1200,
      status: "approved",
      createdAt: new Date("2024-03-01T00:00:00Z"),
      paidAt: null,
    })
    vi.mocked(affiliateRepo).getConversionById.mockResolvedValueOnce({
      id: "cv-3",
      clickId: "clk-3",
      orderId: "ord-3",
      userId: "u-3",
      code: "bob",
      commissionCents: 1200,
      status: "paid",
      createdAt: new Date("2024-03-01T00:00:00Z"),
      paidAt: new Date("2024-03-02T00:00:00Z"),
    })

    const res = await app.request("/api/v1/admin/affiliate/conversions/cv-3/status", {
      method: "PATCH",
      body: JSON.stringify({ status: "paid" }),
      headers: { "Content-Type": "application/json" },
    })
    expect(res.status).toBe(200)
    // paidAt is dynamic; assert it's Date in call
    const callArg = vi.mocked(affiliateRepo).updateConversionStatus.mock.calls[0]?.[0] as Readonly<{
      id: string
      status: string
      paidAt: Date | null
    }>
    expect(callArg).toMatchObject({ id: "cv-3", status: "paid" })
    expect(callArg.paidAt).toBeInstanceOf(Date)
    expect(vi.mocked(affiliateRepo).appendConversionEvent).toHaveBeenCalledWith({
      conversionId: "cv-3",
      actorEmail: "admin@example.com",
      action: "status_change",
      fromStatus: "approved",
      toStatus: "paid",
    })
    const body = await res.json()
    expect(body.status).toBe("paid")
    expect(typeof body.paidAt).toBe("string")
  })
})
