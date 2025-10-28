import { Hono } from "hono"
import { beforeEach, describe, expect, it, vi } from "vitest"

// Mock DB layer used by the webhook route
vi.mock("@repo/db", () => {
  return {
    ordersRepo: {
      updateStatusByPaymentRef: vi.fn(async () => ({
        id: "ord_1",
        email: "user@example.com",
        totalCents: 1234,
      })),
    },
    inventoryRepo: {
      commitOrder: vi.fn(async (_orderId: string) => undefined),
      restockOrder: vi.fn(async (_orderId: string) => undefined),
    },
  } as const
})

// Mock transactional emails to avoid side-effects
vi.mock("../src/lib/transactional-email", () => {
  return {
    transactionalEmail: {
      orderPaid: vi.fn(async () => undefined),
      orderRefunded: vi.fn(async () => undefined),
      orderCancelled: vi.fn(async () => undefined),
    },
  } as const
})

// Mock Stripe SDK: use a global hook to provide the event per test
declare global {
  // eslint-disable-next-line no-var
  var __stripeConstructEvent: (raw: string, sig: string, secret: string) => unknown
}
globalThis.__stripeConstructEvent = (_raw: string, _sig: string, _secret: string) => ({
  type: "noop",
})
vi.mock("stripe", () => {
  class StripeMock {
    public webhooks: { constructEvent: (raw: string, sig: string, secret: string) => unknown }
    constructor(_key: string) {
      this.webhooks = {
        constructEvent: (raw: string, sig: string, secret: string): unknown => {
          return globalThis.__stripeConstructEvent(raw, sig, secret)
        },
      }
    }
  }
  return { default: StripeMock } as const
})

import { inventoryRepo, ordersRepo } from "@repo/db"
import { transactionalEmail } from "../src/lib/transactional-email"
import paymentsStripeRoute from "../src/routes/payments-stripe"

function createApp(): Hono {
  const app = new Hono()
  // mount only the payments/stripe route for focused tests
  app.route("/api/v1/payments/stripe", paymentsStripeRoute)
  return app
}

describe("Stripe webhook integration", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.STRIPE_SECRET_KEY = "sk_test_123"
    process.env.STRIPE_WEBHOOK_SECRET = "whsec_test_123"
  })

  it("handles payment_intent.succeeded -> updates to paid, commits inventory, sends email", async () => {
    // Arrange mocked event
    globalThis.__stripeConstructEvent = () => ({
      type: "payment_intent.succeeded",
      data: { object: { id: "pi_123" } },
    })
    const app = createApp()
    const res = await app.request("/api/v1/payments/stripe/webhook", {
      method: "POST",
      headers: { "stripe-signature": "t=1,v1=abc" },
      body: JSON.stringify({ ok: true }),
    })
    expect(res.status).toBe(200)
    expect(vi.mocked(ordersRepo.updateStatusByPaymentRef)).toHaveBeenCalledWith("pi_123", "paid")
    expect(vi.mocked(inventoryRepo.commitOrder)).toHaveBeenCalledTimes(1)
    expect(vi.mocked(transactionalEmail.orderPaid)).toHaveBeenCalledTimes(1)
  })

  it("handles charge.refunded -> updates to cancelled, restocks inventory, sends refund email", async () => {
    // Arrange mocked event
    globalThis.__stripeConstructEvent = () => ({
      type: "charge.refunded",
      data: { object: { payment_intent: "pi_456" } },
    })
    const app = createApp()
    const res = await app.request("/api/v1/payments/stripe/webhook", {
      method: "POST",
      headers: { "stripe-signature": "t=1,v1=abc" },
      body: JSON.stringify({ ok: true }),
    })
    expect(res.status).toBe(200)
    expect(vi.mocked(ordersRepo.updateStatusByPaymentRef)).toHaveBeenCalledWith(
      "pi_456",
      "cancelled",
    )
    expect(vi.mocked(inventoryRepo.restockOrder)).toHaveBeenCalledTimes(1)
    expect(vi.mocked(transactionalEmail.orderRefunded)).toHaveBeenCalledTimes(1)
  })
})
