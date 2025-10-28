import { createHash } from "node:crypto"
import { Hono } from "hono"
import { beforeEach, describe, expect, it, vi } from "vitest"

// Mock DB idempotency store used by payments-stripe intent route
vi.mock("@repo/db", () => {
  const idem = {
    getByKeyScope: vi.fn(async () => null),
    create: vi.fn(async () => undefined),
  }
  return { idempotencyRepo: idem } as const
})

// Minimal Stripe mock for intent creation
vi.mock("stripe", () => {
  type PaymentIntentsAPI = Readonly<{
    create: (
      args: Readonly<{
        amount: number
        currency: string
        metadata?: Readonly<Record<string, string>>
        automatic_payment_methods?: Readonly<{ enabled: boolean }>
      }>,
      opts?: Readonly<{ idempotencyKey?: string }>,
    ) => Promise<Readonly<{ id: string; client_secret: string | null }>>
  }>
  class StripeMock {
    public paymentIntents: PaymentIntentsAPI
    constructor(_key: string) {
      this.paymentIntents = {
        create: vi.fn(async (_args, opts) => {
          const key = opts?.idempotencyKey ? `_${opts.idempotencyKey}` : ""
          return { id: `pi_test${key}`, client_secret: `cs_test${key}` } as const
        }),
      } as PaymentIntentsAPI
    }
  }
  return { default: StripeMock } as const
})

import { idempotencyRepo } from "@repo/db"
import paymentsStripeRoute from "../src/routes/payments-stripe"

function createApp(): Hono {
  const app = new Hono()
  app.route("/api/v1/payments/stripe", paymentsStripeRoute)
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

describe("Stripe intent idempotency", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.STRIPE_SECRET_KEY = "sk_test_123"
  })

  it("creates new intent when no idempotency key provided", async () => {
    const app = createApp()
    const res = await app.request("/api/v1/payments/stripe/intent", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ amountCents: 1234, currency: "usd" }),
    })
    expect(res.status).toBe(201)
    const body = (await res.json()) as Readonly<{ clientSecret: string | null }>
    expect(typeof body.clientSecret === "string" || body.clientSecret === null).toBe(true)
    expect(vi.mocked(idempotencyRepo.create)).not.toHaveBeenCalled()
  })

  it("persists and replays response when idempotent with same payload", async () => {
    const app = createApp()
    const idemKey = "idem-123"
    const payload = { amountCents: 5555, currency: "usd" } as const
    // First call: no existing record
    vi.mocked(idempotencyRepo.getByKeyScope).mockResolvedValueOnce(null)
    const res1 = await app.request("/api/v1/payments/stripe/intent", {
      method: "POST",
      headers: { "content-type": "application/json", "Idempotency-Key": idemKey },
      body: JSON.stringify(payload),
    })
    expect(res1.status).toBe(201)
    const json1 = (await res1.json()) as Readonly<{ clientSecret: string | null }>
    expect(typeof json1.clientSecret === "string" || json1.clientSecret === null).toBe(true)
    expect(vi.mocked(idempotencyRepo.create)).toHaveBeenCalledTimes(1)

    // Second call: return stored response
    // Match the route's hashing which includes zod defaults (metadata: {})
    const requestHash = sha256Hex(stableStringify({ ...payload, metadata: {} }))
    vi.mocked(idempotencyRepo.getByKeyScope).mockResolvedValueOnce({
      key: idemKey,
      scope: "payments/stripe/intent",
      requestHash,
      responseJson: JSON.stringify(json1),
      status: 201,
      createdAt: new Date(),
    })
    const res2 = await app.request("/api/v1/payments/stripe/intent", {
      method: "POST",
      headers: { "content-type": "application/json", "Idempotency-Key": idemKey },
      body: JSON.stringify(payload),
    })
    expect(res2.status).toBe(201)
    const json2 = await res2.json()
    expect(json2).toEqual(json1)
  })

  it("returns 409 when same key used with different payload", async () => {
    const app = createApp()
    const idemKey = "idem-xyz"
    // Existing entry with some requestHash
    vi.mocked(idempotencyRepo.getByKeyScope).mockResolvedValueOnce({
      key: idemKey,
      scope: "payments/stripe/intent",
      requestHash: "hash1",
      responseJson: JSON.stringify({ clientSecret: "cs_prev" }),
      status: 201,
      createdAt: new Date(),
    })
    const res = await app.request("/api/v1/payments/stripe/intent", {
      method: "POST",
      headers: { "content-type": "application/json", "Idempotency-Key": idemKey },
      body: JSON.stringify({ amountCents: 999, currency: "usd" }),
    })
    expect(res.status).toBe(409)
  })
})
