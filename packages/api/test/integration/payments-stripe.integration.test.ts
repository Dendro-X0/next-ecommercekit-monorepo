import { Hono } from "hono"
import { beforeEach, describe, expect, it, vi } from "vitest"

// Ensure env is set BEFORE importing route
process.env.WEB_ORIGIN = process.env.WEB_ORIGIN || "http://localhost:3000"
process.env.STRIPE_SECRET_KEY = "sk_test_dummy"
process.env.STRIPE_WEBHOOK_SECRET = "whsec_dummy"

// In-memory idempotency store to emulate @repo/db behavior
const idemStore = new Map<string, { requestHash: string; responseJson: string; status: number }>()

// Mocks for DB layer
vi.mock("@repo/db", () => {
  return {
    ordersRepo: {
      updateStatusByPaymentRef: vi.fn(async () => ({
        id: "order1",
        email: "u@example.com",
        totalCents: 2599,
      })),
    },
    inventoryRepo: {
      commitOrder: vi.fn(async (_orderId: string) => undefined),
      restockOrder: vi.fn(async (_orderId: string) => undefined),
    },
    idempotencyRepo: {
      getByKeyScope: vi.fn(async (key: string, scope: string) => {
        const rec = idemStore.get(`${scope}:${key}`)
        return rec
          ? {
              key,
              scope,
              requestHash: rec.requestHash,
              responseJson: rec.responseJson,
              status: rec.status,
            }
          : null
      }),
      create: vi.fn(
        async (args: {
          key: string
          scope: string
          requestHash: string
          responseJson: string
          status: number
        }) => {
          idemStore.set(`${args.scope}:${args.key}`, {
            requestHash: args.requestHash,
            responseJson: args.responseJson,
            status: args.status,
          })

          return undefined
        },
      ),
    },
  } as const
})

// Mock transactional email
vi.mock("../../src/lib/transactional-email", () => ({
  transactionalEmail: {
    orderPaid: vi.fn(async () => undefined),
    orderCancelled: vi.fn(async () => undefined),
    orderRefunded: vi.fn(async () => undefined),
  },
}))

// Mock Stripe SDK
let stripeInstance: StripeMock | null = null
class StripeMock {
  constructor(_key?: string) {
    stripeInstance = this
  }
  paymentIntents = {
    create: vi.fn(
      async (args: {
        amount: number
        currency: string
        metadata?: Record<string, string> | undefined
      }) => {
        // Debug call
        // eslint-disable-next-line no-console
        console.log("StripeMock.paymentIntents.create called", args)
        return {
          id: "pi_123",
          client_secret: "cs_test_123",
          status: "requires_payment_method",
        }
      },
    ),
    capture: vi.fn(async (_id: string, _args?: { amount_to_capture?: number }) => ({
      id: "pi_123",
      status: "succeeded",
    })),
  }
  refunds = {
    create: vi.fn(async (_args: { payment_intent: string; amount?: number; reason?: string }) => ({
      id: "re_123",
      status: "succeeded",
    })),
  }
  webhooks = {
    constructEvent: vi.fn((raw: string, _sig: string, _secret: string) => {
      return JSON.parse(raw)
    }),
  }
}

vi.mock("stripe", () => ({ __esModule: true, default: StripeMock }))

import { idempotencyRepo, inventoryRepo, ordersRepo } from "@repo/db"
import { transactionalEmail } from "../../src/lib/transactional-email"

async function loadRoute() {
  const mod: any = await import("../../src/routes/payments-stripe")
  return mod.default
}

async function createApp(): Promise<Hono> {
  const app = new Hono()
  // Inject test user from header for AdminGuard
  app.use("*", async (c, next) => {
    const hdr = c.req.header("x-test-user")
    if (hdr) {
      try {
        const user = JSON.parse(hdr) as {
          email?: string
          role?: string
          roles?: string[]
          isAdmin?: boolean
        }
        ;(c as unknown as { set: (k: string, v: unknown) => void }).set("user", user)
      } catch {
        // ignore
      }
    }
    await next()
  })
  const route = await loadRoute()
  app.route("/api/v1/payments/stripe", route)
  return app
}

async function makeIntentRequest(app: Hono, body: object, key?: string): Promise<Response> {
  const headers: Record<string, string> = { "content-type": "application/json" }
  if (key) headers["Idempotency-Key"] = key
  const res = await app.request("/api/v1/payments/stripe/intent", {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  })
  return res
}

describe("Stripe integration routes", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    idemStore.clear()
  })

  it("intent honors idempotency key and payload hash", async () => {
    const app = await createApp()
    const cfg = await app.request("/api/v1/payments/stripe/config")
    if (cfg.status !== 200) {
      console.log("/config status", cfg.status, await cfg.text())
    }
    const cfgJson = (await cfg.json()) as { configured: boolean }
    expect(cfgJson.configured).toBe(true)
    const payload1 = { amountCents: 2599, currency: "usd" }
    const res1 = await makeIntentRequest(app, payload1, "k1")
    if (res1.status !== 201) {
      try {
        const dbg = await res1.json()
        console.error("intent create failed:", res1.status, dbg)
      } catch {
        console.error("intent create failed (non-json):", res1.status, await res1.text())
      }
    }
    expect(res1.status).toBe(201)
    const json1 = (await res1.json()) as { clientSecret: string | null }
    expect(json1.clientSecret).toBe("cs_test_123")
    expect(vi.mocked(idempotencyRepo.create)).toHaveBeenCalledTimes(1)

    // Reuse same key with same payload: should be served from store and not call Stripe again
    const res2 = await makeIntentRequest(app, payload1, "k1")
    expect(res2.status).toBe(201)
    const json2 = (await res2.json()) as { clientSecret: string | null }
    expect(json2.clientSecret).toBe("cs_test_123")

    // Same key with different payload: conflict 409
    const payload2 = { amountCents: 1999, currency: "usd" }
    const res3 = await makeIntentRequest(app, payload2, "k1")
    expect(res3.status).toBe(409)
  })

  it("webhook payment_intent.succeeded updates order & emails", async () => {
    const app = await createApp()
    const event = {
      type: "payment_intent.succeeded",
      data: { object: { id: "pi_123" } },
    }
    const res = await app.request("/api/v1/payments/stripe/webhook", {
      method: "POST",
      headers: { "stripe-signature": "t", "content-type": "application/json" },
      body: JSON.stringify(event),
    })
    expect(res.status).toBe(200)
    expect(vi.mocked(ordersRepo.updateStatusByPaymentRef)).toHaveBeenCalledWith("pi_123", "paid")
    expect(vi.mocked(inventoryRepo.commitOrder)).toHaveBeenCalledTimes(1)
    expect(vi.mocked(transactionalEmail.orderPaid)).toHaveBeenCalledTimes(1)
  })

  it("webhook payment_intent.canceled restocks & emails cancelled", async () => {
    const app = await createApp()
    const event = {
      type: "payment_intent.canceled",
      data: { object: { id: "pi_999" } },
    }
    const res = await app.request("/api/v1/payments/stripe/webhook", {
      method: "POST",
      headers: { "stripe-signature": "t", "content-type": "application/json" },
      body: JSON.stringify(event),
    })
    expect(res.status).toBe(200)
    expect(vi.mocked(ordersRepo.updateStatusByPaymentRef)).toHaveBeenCalledWith(
      "pi_999",
      "cancelled",
    )
    expect(vi.mocked(inventoryRepo.restockOrder)).toHaveBeenCalledTimes(1)
    expect(vi.mocked(transactionalEmail.orderCancelled)).toHaveBeenCalledTimes(1)
  })

  it("capture requires admin and updates order", async () => {
    const app = await createApp()
    // Unauthorized
    let res = await app.request("/api/v1/payments/stripe/capture", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ paymentRef: "pi_1" }),
    })
    expect(res.status).toBe(401)

    // Forbidden (non-admin)
    res = await app.request("/api/v1/payments/stripe/capture", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-test-user": JSON.stringify({ email: "u@example.com" }),
      },
      body: JSON.stringify({ paymentRef: "pi_1" }),
    })
    expect(res.status).toBe(403)

    // OK (admin)
    res = await app.request("/api/v1/payments/stripe/capture", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-test-user": JSON.stringify({ email: "admin@example.com", isAdmin: true }),
      },
      body: JSON.stringify({ paymentRef: "pi_1", amountCents: 1500 }),
    })
    expect(res.status).toBe(200)
    expect(vi.mocked(ordersRepo.updateStatusByPaymentRef)).toHaveBeenCalledWith("pi_1", "paid")
    expect(vi.mocked(inventoryRepo.commitOrder)).toHaveBeenCalledTimes(1)
  })

  it("refund requires admin and restocks on success", async () => {
    const app = await createApp()
    // Unauthorized
    let res = await app.request("/api/v1/payments/stripe/refund", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ paymentRef: "pi_2" }),
    })
    expect(res.status).toBe(401)

    // Forbidden
    res = await app.request("/api/v1/payments/stripe/refund", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-test-user": JSON.stringify({ email: "u@example.com" }),
      },
      body: JSON.stringify({ paymentRef: "pi_2" }),
    })
    expect(res.status).toBe(403)

    // OK
    res = await app.request("/api/v1/payments/stripe/refund", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-test-user": JSON.stringify({ email: "admin@example.com", roles: ["admin"] }),
      },
      body: JSON.stringify({
        paymentRef: "pi_2",
        amountCents: 500,
        reason: "requested_by_customer",
      }),
    })
    expect(res.status).toBe(201)
    expect(vi.mocked(ordersRepo.updateStatusByPaymentRef)).toHaveBeenCalledWith("pi_2", "cancelled")
    expect(vi.mocked(inventoryRepo.restockOrder)).toHaveBeenCalledTimes(1)
    // Route does not send email directly for refund
    expect(vi.mocked(transactionalEmail.orderCancelled)).not.toHaveBeenCalled()
    expect(vi.mocked(transactionalEmail.orderRefunded)).not.toHaveBeenCalled()
  })

  it("webhook payment_intent.payment_failed cancels & emails", async () => {
    const app = await createApp()
    const event = {
      id: "evt_fail_1",
      type: "payment_intent.payment_failed",
      data: { object: { id: "pi_fail_1" } },
    }
    const res = await app.request("/api/v1/payments/stripe/webhook", {
      method: "POST",
      headers: { "stripe-signature": "t", "content-type": "application/json" },
      body: JSON.stringify(event),
    })
    expect(res.status).toBe(200)
    expect(vi.mocked(ordersRepo.updateStatusByPaymentRef)).toHaveBeenCalledWith(
      "pi_fail_1",
      "cancelled",
    )
    expect(vi.mocked(inventoryRepo.restockOrder)).toHaveBeenCalledTimes(1)
    expect(vi.mocked(transactionalEmail.orderCancelled)).toHaveBeenCalledTimes(1)
  })

  it("webhook amount_capturable_updated marks paid & emails", async () => {
    const app = await createApp()
    const event = {
      id: "evt_auth_1",
      type: "payment_intent.amount_capturable_updated",
      data: { object: { id: "pi_auth_1" } },
    }
    const res = await app.request("/api/v1/payments/stripe/webhook", {
      method: "POST",
      headers: { "stripe-signature": "t", "content-type": "application/json" },
      body: JSON.stringify(event),
    })
    expect(res.status).toBe(200)
    expect(vi.mocked(ordersRepo.updateStatusByPaymentRef)).toHaveBeenCalledWith("pi_auth_1", "paid")
    expect(vi.mocked(inventoryRepo.commitOrder)).toHaveBeenCalledTimes(1)
    expect(vi.mocked(transactionalEmail.orderPaid)).toHaveBeenCalledTimes(1)
  })

  it("webhook duplicate delivery is idempotent", async () => {
    const app = await createApp()
    const event = {
      id: "evt_dup_1",
      type: "payment_intent.succeeded",
      data: { object: { id: "pi_dup_1" } },
    }
    const first = await app.request("/api/v1/payments/stripe/webhook", {
      method: "POST",
      headers: { "stripe-signature": "t", "content-type": "application/json" },
      body: JSON.stringify(event),
    })
    expect(first.status).toBe(200)
    const second = await app.request("/api/v1/payments/stripe/webhook", {
      method: "POST",
      headers: { "stripe-signature": "t", "content-type": "application/json" },
      body: JSON.stringify(event),
    })
    expect(second.status).toBe(200)
    // Ensure side-effects happened only once
    expect(vi.mocked(ordersRepo.updateStatusByPaymentRef)).toHaveBeenCalledWith("pi_dup_1", "paid")
    expect(vi.mocked(ordersRepo.updateStatusByPaymentRef)).toHaveBeenCalledTimes(1)
    expect(vi.mocked(inventoryRepo.commitOrder)).toHaveBeenCalledTimes(1)
    expect(vi.mocked(transactionalEmail.orderPaid)).toHaveBeenCalledTimes(1)
  })
})
