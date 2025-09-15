import { Hono } from "hono"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { ZodError } from "zod"

// Mock the DB layer used by the route
vi.mock("@repo/db", () => {
  const repo = {
    create: vi.fn(async (data: any) => ({ id: "p-new", ...data })),
    update: vi.fn(async (_id: string, patch: any) => ({ id: _id, ...patch })),
    remove: vi.fn(async (_id: string) => true),
  }
  return { productsRepo: repo } as const
})

import { productsRepo } from "@repo/db"
import productsRoute from "../src/routes/products"

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
  app.route("/api/v1/products", productsRoute)
  return app
}

describe("Admin Products CRUD validation & guards", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // CREATE
  it("POST /api/v1/products denies unauthenticated", async () => {
    const app = createApp("none")
    const res = await app.request("/api/v1/products", { method: "POST" })
    expect(res.status).toBe(401)
  })

  it("POST /api/v1/products forbids non-admin", async () => {
    const app = createApp("user")
    const res = await app.request("/api/v1/products", { method: "POST" })
    expect(res.status).toBe(403)
  })

  it("POST /api/v1/products returns 400 for invalid body", async () => {
    const app = createApp("admin")
    const invalidBody = { name: "No slug", priceCents: -5 }
    const res = await app.request("/api/v1/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(invalidBody),
    })
    expect(res.status).toBe(400)
  })

  it("POST /api/v1/products creates with valid body", async () => {
    const app = createApp("admin")
    const body = {
      slug: "tee-basic",
      name: "Basic Tee",
      priceCents: 1999,
      currency: "USD" as const,
      featured: true,
    }
    const res = await app.request("/api/v1/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
    expect(res.status).toBe(201)
    expect(vi.mocked(productsRepo.create)).toHaveBeenCalledWith(body)
    const json = await res.json()
    expect(json).toMatchObject({
      id: "p-new",
      slug: "tee-basic",
      name: "Basic Tee",
      priceCents: 1999,
    })
  })

  // UPDATE
  it("PUT /api/v1/products/:id denies unauthenticated", async () => {
    const app = createApp("none")
    const res = await app.request("/api/v1/products/p1", { method: "PUT" })
    expect(res.status).toBe(401)
  })

  it("PUT /api/v1/products/:id forbids non-admin", async () => {
    const app = createApp("user")
    const res = await app.request("/api/v1/products/p1", { method: "PUT" })
    expect(res.status).toBe(403)
  })

  it("PUT /api/v1/products/:id returns 400 for invalid body", async () => {
    const app = createApp("admin")
    const res = await app.request("/api/v1/products/p1", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ priceCents: -1 }),
    })
    expect(res.status).toBe(400)
  })

  it("PUT /api/v1/products/:id returns 404 when repo returns null", async () => {
    const app = createApp("admin")
    vi.mocked(productsRepo.update).mockResolvedValueOnce(null as any)
    const res = await app.request("/api/v1/products/p-missing", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Updated" }),
    })
    expect(res.status).toBe(404)
  })

  it("PUT /api/v1/products/:id updates with valid patch", async () => {
    const app = createApp("admin")
    const res = await app.request("/api/v1/products/p1", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Updated", featured: true }),
    })
    expect(res.status).toBe(200)
    expect(vi.mocked(productsRepo.update)).toHaveBeenCalledWith("p1", {
      name: "Updated",
      featured: true,
    })
    const json = await res.json()
    expect(json).toMatchObject({ id: "p1", name: "Updated", featured: true })
  })

  // DELETE
  it("DELETE /api/v1/products/:id denies unauthenticated", async () => {
    const app = createApp("none")
    const res = await app.request("/api/v1/products/p1", { method: "DELETE" })
    expect(res.status).toBe(401)
  })

  it("DELETE /api/v1/products/:id forbids non-admin", async () => {
    const app = createApp("user")
    const res = await app.request("/api/v1/products/p1", { method: "DELETE" })
    expect(res.status).toBe(403)
  })

  it("DELETE /api/v1/products/:id returns 404 when repo.remove returns false", async () => {
    const app = createApp("admin")
    vi.mocked(productsRepo.remove).mockResolvedValueOnce(false)
    const res = await app.request("/api/v1/products/p-missing", { method: "DELETE" })
    expect(res.status).toBe(404)
  })

  it("DELETE /api/v1/products/:id returns 200 with ok true when removed", async () => {
    const app = createApp("admin")
    const res = await app.request("/api/v1/products/p1", { method: "DELETE" })
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json).toEqual({ ok: true })
  })
})
