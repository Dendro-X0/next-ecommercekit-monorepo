import { Hono } from "hono"
import { beforeEach, describe, expect, it, vi } from "vitest"

// Ensure envs present BEFORE importing route (env is read at import time)
process.env.WEB_ORIGIN = process.env.WEB_ORIGIN || "http://localhost:3000"
process.env.PAYPAL_CLIENT_ID = "pp_client"
process.env.PAYPAL_CLIENT_SECRET = "pp_secret"
process.env.PAYPAL_MODE = "sandbox"
process.env.PAYPAL_WEBHOOK_ID = "wh_123"

// Mock env module to avoid early-import caching from other suites
vi.mock("../../src/env", () => ({
  apiEnv: {
    WEB_ORIGIN: process.env.WEB_ORIGIN!,
    ADMIN_EMAILS_SET: new Set<string>(),
    AFFILIATE_COMMISSION_PCT: 10,
    TAX_RATE: 0.08,
    FREE_SHIPPING_THRESHOLD: 50,
    FLAT_SHIPPING_FEE: 9.99,
    RESEND_API_KEY: undefined,
    EMAIL_FROM: undefined,
    CONTACT_RATE_LIMIT_MAX: 5,
    CONTACT_RATE_LIMIT_WINDOW_MS: 60000,
    API_RATE_LIMIT_MAX: 120,
    API_RATE_LIMIT_WINDOW_MS: 60000,
    UPSTASH_REDIS_REST_URL: undefined,
    UPSTASH_REDIS_REST_TOKEN: undefined,
    PAYPAL_CLIENT_ID: process.env.PAYPAL_CLIENT_ID!,
    PAYPAL_CLIENT_SECRET: process.env.PAYPAL_CLIENT_SECRET!,
    PAYPAL_MODE: "sandbox" as const,
    PAYPAL_WEBHOOK_ID: process.env.PAYPAL_WEBHOOK_ID!,
    STRIPE_CONFIGURED: false,
    PAYPAL_CONFIGURED: true,
    RESEND_CONFIGURED: false,
  },
}))

// In-memory idempotency store
const idemStore = new Map<string, { responseJson: string; status: number }>()

// Mock DB layer used by the PayPal routes
vi.mock("@repo/db", () => ({
  ordersRepo: {
    updateStatusByPaymentRef: vi.fn(async () => ({
      id: "o1",
      email: "u@example.com",
      totalCents: 1999,
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
        ? { key, scope, requestHash: "-", responseJson: rec.responseJson, status: rec.status }
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
          responseJson: args.responseJson,
          status: args.status,
        })
        return undefined
      },
    ),
  },
}))

// Mock transactional emails
vi.mock("../../src/lib/transactional-email", () => ({
  transactionalEmail: {
    orderPaid: vi.fn(async () => undefined),
    orderRefunded: vi.fn(async () => undefined),
    orderCancelled: vi.fn(async () => undefined),
  },
}))

// Intercept global fetch for PayPal HTTP calls
const fetchMock = vi.fn()
vi.stubGlobal("fetch", fetchMock)

import { idempotencyRepo, inventoryRepo, ordersRepo } from "@repo/db"
import { transactionalEmail } from "../../src/lib/transactional-email"

async function loadRoute() {
  const mod: any = await import("../../src/routes/payments-paypal")
  return mod.default
}

async function createApp(): Promise<Hono> {
  const app = new Hono()
  const route = await loadRoute()
  app.route("/api/v1/payments/paypal", route)
  return app
}

function mockToken(): void {
  // First call is oauth token
  fetchMock.mockResolvedValueOnce(
    new Response(JSON.stringify({ access_token: "token123" }), { status: 200 }),
  )
}

function mockCreateOrder(): void {
  // Second call is create order
  fetchMock.mockResolvedValueOnce(
    new Response(
      JSON.stringify({
        id: "PP-ORDER-1",
        links: [{ rel: "approve", href: "https://paypal.test/approve/PP-ORDER-1" }],
      }),
      { status: 201 },
    ),
  )
}

function mockCaptureOk(): void {
  // Capture call returns ok JSON
  fetchMock.mockResolvedValueOnce(
    new Response(JSON.stringify({ id: "CAP-1", status: "COMPLETED" }), { status: 201 }),
  )
}

function mockVerifyWebhookOk(): void {
  // Token for webhook verify, then verify endpoint
  fetchMock
    .mockResolvedValueOnce(
      new Response(JSON.stringify({ access_token: "token123" }), { status: 200 }),
    )
    .mockResolvedValueOnce(
      new Response(JSON.stringify({ verification_status: "SUCCESS" }), { status: 200 }),
    )
}

describe("PayPal integration routes", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    fetchMock.mockReset()
    idemStore.clear()
  })

  it("create returns id and approveUrl", async () => {
    mockToken()
    mockCreateOrder()
    const app = await createApp()
    const res = await app.request("/api/v1/payments/paypal/create", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ amountCents: 2599, currency: "USD" }),
    })
    expect(res.status).toBe(201)
    const json = await res.json()
    expect(json.id).toBe("PP-ORDER-1")
    expect(json.approveUrl).toContain("approve/PP-ORDER-1")
    // Verify calls: token + create
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  it("capture updates order to paid and commits inventory", async () => {
    mockToken()
    mockCaptureOk()
    const app = await createApp()
    const res = await app.request("/api/v1/payments/paypal/capture", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ orderId: "PP-ORDER-1" }),
    })
    expect(res.status).toBe(200)
    expect(vi.mocked(ordersRepo.updateStatusByPaymentRef)).toHaveBeenCalledWith(
      "PP-ORDER-1",
      "paid",
    )
    expect(vi.mocked(inventoryRepo.commitOrder)).toHaveBeenCalledTimes(1)
  })

  it("webhook PAYMENT.CAPTURE.COMPLETED verifies and updates to paid then sends email", async () => {
    mockVerifyWebhookOk()
    const app = await createApp()
    const payload = {
      event_type: "PAYMENT.CAPTURE.COMPLETED",
      resource: {
        supplementary_data: { related_ids: { order_id: "PP-ORDER-XYZ" } },
        links: [
          { rel: "up", href: "https://api-m.sandbox.paypal.com/v2/checkout/orders/PP-ORDER-XYZ" },
        ],
      },
    }
    const res = await app.request("/api/v1/payments/paypal/webhook", {
      method: "POST",
      headers: {
        "paypal-transmission-id": "t1",
        "paypal-transmission-time": new Date().toISOString(),
        "paypal-cert-url": "https://cert",
        "paypal-auth-algo": "algo",
        "paypal-transmission-sig": "sig",
        "content-type": "application/json",
      },
      body: JSON.stringify(payload),
    })
    expect(res.status).toBe(200)
    expect(vi.mocked(ordersRepo.updateStatusByPaymentRef)).toHaveBeenCalledWith(
      "PP-ORDER-XYZ",
      "paid",
    )
    expect(vi.mocked(inventoryRepo.commitOrder)).toHaveBeenCalledTimes(1)
    expect(vi.mocked(transactionalEmail.orderPaid)).toHaveBeenCalledTimes(1)
  })

  it("webhook PAYMENT.CAPTURE.DENIED restocks & emails cancelled", async () => {
    mockVerifyWebhookOk()
    const app = await createApp()
    const payload = {
      event_type: "PAYMENT.CAPTURE.DENIED",
      resource: {
        supplementary_data: { related_ids: { order_id: "PP-ORDER-DENIED" } },
        links: [
          {
            rel: "up",
            href: "https://api-m.sandbox.paypal.com/v2/checkout/orders/PP-ORDER-DENIED",
          },
        ],
      },
    }
    const res = await app.request("/api/v1/payments/paypal/webhook", {
      method: "POST",
      headers: {
        "paypal-transmission-id": "t-denied-1",
        "paypal-transmission-time": new Date().toISOString(),
        "paypal-cert-url": "https://cert",
        "paypal-auth-algo": "algo",
        "paypal-transmission-sig": "sig",
        "content-type": "application/json",
      },
      body: JSON.stringify(payload),
    })
    expect(res.status).toBe(200)
    expect(vi.mocked(ordersRepo.updateStatusByPaymentRef)).toHaveBeenCalledWith(
      "PP-ORDER-DENIED",
      "cancelled",
    )
    expect(vi.mocked(inventoryRepo.restockOrder)).toHaveBeenCalledTimes(1)
    expect(vi.mocked(transactionalEmail.orderCancelled)).toHaveBeenCalledTimes(1)
  })

  it("webhook PAYMENT.CAPTURE.REFUNDED restocks & emails refunded", async () => {
    mockVerifyWebhookOk()
    const app = await createApp()
    const payload = {
      event_type: "PAYMENT.CAPTURE.REFUNDED",
      resource: {
        supplementary_data: { related_ids: { order_id: "PP-ORDER-REFUNDED" } },
        links: [
          {
            rel: "up",
            href: "https://api-m.sandbox.paypal.com/v2/checkout/orders/PP-ORDER-REFUNDED",
          },
        ],
      },
    }
    const res = await app.request("/api/v1/payments/paypal/webhook", {
      method: "POST",
      headers: {
        "paypal-transmission-id": "t-ref-1",
        "paypal-transmission-time": new Date().toISOString(),
        "paypal-cert-url": "https://cert",
        "paypal-auth-algo": "algo",
        "paypal-transmission-sig": "sig",
        "content-type": "application/json",
      },
      body: JSON.stringify(payload),
    })
    expect(res.status).toBe(200)
    expect(vi.mocked(ordersRepo.updateStatusByPaymentRef)).toHaveBeenCalledWith(
      "PP-ORDER-REFUNDED",
      "cancelled",
    )
    expect(vi.mocked(inventoryRepo.restockOrder)).toHaveBeenCalledTimes(1)
    expect(vi.mocked(transactionalEmail.orderRefunded)).toHaveBeenCalledTimes(1)
  })

  it("webhook duplicate delivery is idempotent (PayPal)", async () => {
    // Two verify cycles for two deliveries
    mockVerifyWebhookOk()
    mockVerifyWebhookOk()
    const app = await createApp()
    const payload = {
      event_type: "PAYMENT.CAPTURE.COMPLETED",
      resource: {
        supplementary_data: { related_ids: { order_id: "PP-ORDER-DUP" } },
        links: [
          { rel: "up", href: "https://api-m.sandbox.paypal.com/v2/checkout/orders/PP-ORDER-DUP" },
        ],
      },
    }
    const headers = {
      "paypal-transmission-id": "t-dup-1",
      "paypal-transmission-time": new Date().toISOString(),
      "paypal-cert-url": "https://cert",
      "paypal-auth-algo": "algo",
      "paypal-transmission-sig": "sig",
      "content-type": "application/json",
    }
    const first = await app.request("/api/v1/payments/paypal/webhook", {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
    })
    expect(first.status).toBe(200)
    const second = await app.request("/api/v1/payments/paypal/webhook", {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
    })
    expect(second.status).toBe(200)
    expect(vi.mocked(ordersRepo.updateStatusByPaymentRef)).toHaveBeenCalledWith(
      "PP-ORDER-DUP",
      "paid",
    )
    expect(vi.mocked(ordersRepo.updateStatusByPaymentRef)).toHaveBeenCalledTimes(1)
    expect(vi.mocked(inventoryRepo.commitOrder)).toHaveBeenCalledTimes(1)
    expect(vi.mocked(transactionalEmail.orderPaid)).toHaveBeenCalledTimes(1)
  })
})
