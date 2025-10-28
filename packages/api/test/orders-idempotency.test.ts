import { createHash } from "node:crypto"
import { Hono } from "hono"
import { beforeEach, describe, expect, it, vi } from "vitest"

// Mocks for DB layer used by orders route
vi.mock("@repo/db", () => {
  const orders = {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    create: vi.fn(
      async (
        args: Readonly<{
          id: string
          userId: string | null
          guestId: string | null
          email: string | null
          status: "pending" | "paid"
          paymentProvider: "stripe" | "paypal" | null
          paymentRef: string | null
          subtotalCents: number
          shippingCents: number
          taxCents: number
          totalCents: number
          affiliateCode: string | null
          affiliateClickId: string | null
          affiliateCommissionCents: number
          affiliateStatus: "pending" | null
          affiliateAttributedAt: Date | null
          items: ReadonlyArray<
            Readonly<{
              id: string
              productId?: string
              name: string
              priceCents: number
              quantity: number
              imageUrl?: string | null
            }>
          >
        }>,
      ) => ({
        id: args.id,
        createdAt: new Date(),
        email: args.email,
        status: args.status,
        paymentProvider: args.paymentProvider,
        paymentRef: args.paymentRef,
        items: args.items.map((it) => ({
          id: it.id,
          productId: it.productId ?? null,
          name: it.name,
          priceCents: it.priceCents,
          quantity: it.quantity,
          imageUrl: it.imageUrl ?? null,
        })),
        subtotalCents: args.subtotalCents,
        shippingCents: args.shippingCents,
        taxCents: args.taxCents,
        totalCents: args.totalCents,
      }),
    ),
    // helpers used by GETs but not by this test
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any
  const idem = {
    getByKeyScope: vi.fn(async () => null as const),
    create: vi.fn(async () => undefined),
  }
  const inv = {
    reserveForOrder: vi.fn(async () => undefined),
    releaseOrder: vi.fn(async () => undefined),
    commitOrder: vi.fn(async () => undefined),
  }
  const aff = {
    listClicksByCode: vi.fn(async () => [] as const),
    createConversion: vi.fn(async () => ({ id: "conv_1" })),
    markClickConverted: vi.fn(async () => undefined),
  }
  return {
    ordersRepo: orders,
    idempotencyRepo: idem,
    inventoryRepo: inv,
    affiliateRepo: aff,
  } as const
})

// Mock transactional emails to avoid side-effects
vi.mock("../src/lib/transactional-email", () => ({
  transactionalEmail: {
    orderPaid: vi.fn(async () => undefined),
    orderCreated: vi.fn(async () => undefined),
  },
}))

import { idempotencyRepo, inventoryRepo, ordersRepo } from "@repo/db"
import ordersRoute from "../src/routes/orders"

function createApp(): Hono {
  const app = new Hono()
  app.route("/api/v1/orders", ordersRoute)
  return app
}

function stableStringify(obj: unknown): string {
  const seen = new WeakSet<object>()
  const replacer = (_k: string, v: unknown): unknown => {
    if (v && typeof v === "object") {
      if (seen.has(v as object)) return undefined
      seen.add(v as object)
      const entries = Object.entries(v as Record<string, unknown>).sort(([a], [b]) =>
        a < b ? -1 : a > b ? 1 : 0,
      )
      return entries.reduce<Record<string, unknown>>((acc, [k, val]) => {
        acc[k] = val
        return acc
      }, {})
    }
    return v
  }
  return JSON.stringify(obj, replacer)
}

function sha256Hex(input: string): string {
  return createHash("sha256").update(input).digest("hex")
}

describe("Orders create idempotency", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("creates once then returns cached response on retry with same key+payload", async () => {
    const app = createApp()
    const body = {
      items: [{ name: "Test", price: 12.34, quantity: 1 }],
      email: "buyer@example.com",
      status: "pending" as const,
    }
    const idemKey = "key-123"
    vi.mocked(idempotencyRepo.getByKeyScope).mockResolvedValueOnce(null)
    const res1 = await app.request("/api/v1/orders", {
      method: "POST",
      headers: { "content-type": "application/json", "Idempotency-Key": idemKey },
      body: JSON.stringify(body),
    })
    expect(res1.status).toBe(201)
    const json1 = await res1.json()
    expect(json1).toHaveProperty("id")
    expect(vi.mocked(ordersRepo.create)).toHaveBeenCalledTimes(1)
    expect(vi.mocked(inventoryRepo.reserveForOrder)).toHaveBeenCalledTimes(1)

    const requestHash = sha256Hex(stableStringify(body))
    vi.mocked(idempotencyRepo.getByKeyScope).mockResolvedValueOnce({
      key: idemKey,
      scope: "orders/create",
      requestHash,
      responseJson: JSON.stringify(json1),
      status: 201,
    })
    const res2 = await app.request("/api/v1/orders", {
      method: "POST",
      headers: { "content-type": "application/json", "Idempotency-Key": idemKey },
      body: JSON.stringify(body),
    })
    expect(res2.status).toBe(200)
    const json2 = await res2.json()
    expect(json2).toEqual(json1)
    expect(vi.mocked(ordersRepo.create)).toHaveBeenCalledTimes(1)
    expect(vi.mocked(inventoryRepo.reserveForOrder)).toHaveBeenCalledTimes(1)
  })

  it("rejects reuse with different payload as 409", async () => {
    const app = createApp()
    const body1 = { items: [{ name: "A", price: 10, quantity: 1 }], email: "a@example.com" }
    const body2 = { items: [{ name: "B", price: 20, quantity: 1 }], email: "b@example.com" }
    const idemKey = "key-xyz"
    const requestHash1 = sha256Hex(stableStringify(body1))
    vi.mocked(idempotencyRepo.getByKeyScope).mockResolvedValueOnce({
      key: idemKey,
      scope: "orders/create",
      requestHash: requestHash1,
      responseJson: JSON.stringify({ id: "ord_prev" }),
      status: 201,
    })
    const res = await app.request("/api/v1/orders", {
      method: "POST",
      headers: { "content-type": "application/json", "Idempotency-Key": idemKey },
      body: JSON.stringify(body2),
    })
    expect(res.status).toBe(409)
  })
})
