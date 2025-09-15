import { Hono } from "hono"
import { beforeEach, describe, expect, it, vi } from "vitest"

// Mock Resend to avoid network calls
vi.mock("resend", () => {
  class ResendMock {
    public readonly emails = { send: vi.fn(async () => ({ id: "mock" })) } as const
  }
  return { Resend: ResendMock }
})

// Mock DB contacts repository to avoid real DB and assert persistence
vi.mock("@repo/db", () => {
  return {
    contactsRepo: {
      create: vi.fn(async () => ({ id: "c1" })),
    },
  } as const
})

import { contactsRepo } from "@repo/db"

/**
 * Build a Hono app instance and mount contact route.
 * Ensures fresh module state per test via resetModules and late import.
 */
async function createApp(): Promise<Hono> {
  const app = new Hono()
  const route = (await import("../src/routes/contact"))?.default
  app.route("/api/v1/contact", route)
  return app
}

describe("Contact API", () => {
  beforeEach(async () => {
    vi.resetModules()
    process.env.WEB_ORIGIN = "http://localhost:3000"
    process.env.ADMIN_EMAILS = "admin@example.com"
    process.env.AFFILIATE_COMMISSION_PCT = "10"
    process.env.RESEND_API_KEY = "test_key"
    process.env.EMAIL_FROM = "Ecommerce <no-reply@example.com>"
    process.env.CONTACT_RATE_LIMIT_MAX = "1" // make it easy to hit rate limit
    process.env.CONTACT_RATE_LIMIT_WINDOW_MS = "60000"
  })

  it("returns 400 on invalid payload", async () => {
    const app = await createApp()
    const res = await app.request("/api/v1/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-forwarded-for": "10.0.0.1" },
      body: JSON.stringify({ subject: "Hi", message: "Test" }), // missing name/email
    })
    expect(res.status).toBe(400)
  })

  it("accepts valid payload with 202", async () => {
    const app = await createApp()
    const res = await app.request("/api/v1/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-forwarded-for": "10.0.0.2" },
      body: JSON.stringify({
        name: "John Doe",
        email: "john@example.com",
        subject: "Question",
        message: "Hello!",
      }),
    })
    expect(res.status).toBe(202)
    const body = (await res.json()) as Readonly<{ ok: boolean }>
    expect(body.ok).toBe(true)
    expect(vi.mocked(contactsRepo.create)).toHaveBeenCalledTimes(1)
  })

  it("rate limits subsequent requests from same IP", async () => {
    const app = await createApp()
    const ip = "10.0.0.3"
    const payload = {
      name: "Jane",
      email: "jane@example.com",
      subject: "Hi",
      message: "First",
    } as const

    const first = await app.request("/api/v1/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-forwarded-for": ip },
      body: JSON.stringify(payload),
    })
    expect(first.status).toBe(202)

    const second = await app.request("/api/v1/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-forwarded-for": ip },
      body: JSON.stringify({ ...payload, message: "Second" }),
    })
    expect(second.status).toBe(429)
  })
})
