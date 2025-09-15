import { categoriesRepo, inventoryRepo, ordersRepo, productsRepo } from "@repo/db"
import type { Context } from "hono"
import { Hono } from "hono"
import { z } from "zod"
import { AdminGuard } from "../lib/admin-guard"
import { transactionalEmail } from "../lib/transactional-email"
import { validate } from "../lib/validate"

/**
 * Admin routes for dashboard KPIs and widgets.
 * One export per file: default hono sub-app.
 */

const recentQuerySchema = z.object({
  limit: z.coerce.number().int().positive().max(100).optional().default(10),
})

// Shape for recent products list
type RecentProduct = Readonly<{
  id: string
  name: string
  slug: string
  priceCents: number
  currency: "USD"
  imageUrl?: string
  createdAt: string
}>

// Stats response
type StatsResponse = Readonly<{
  productsCount: number
  categoriesCount: number
  featuredProductsCount: number
  digitalProductsCount: number
  physicalProductsCount: number
  latestCreatedAt?: string
}>

const adminRoute = new Hono()
  /**
   * GET /api/v1/admin/stats
   */
  .get("/stats", async (c: Context) => {
    const guard = AdminGuard.ensureAdmin(c)
    if (guard) return guard
    try {
      const [pc, cc, fc, dc, phc, latest] = await Promise.all([
        productsRepo.countAll(),
        categoriesRepo.countAll(),
        productsRepo.countFeatured(),
        productsRepo.countByKind("digital"),
        productsRepo.countByKind("physical"),
        productsRepo.latestCreatedAt(),
      ])
      const res: StatsResponse = {
        productsCount: pc,
        categoriesCount: cc,
        featuredProductsCount: fc,
        digitalProductsCount: dc,
        physicalProductsCount: phc,
        latestCreatedAt: latest ?? undefined,
      }
      return c.json(res, 200)
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load stats"
      return c.json({ error: message }, 500)
    }
  })
  /**
   * GET /api/v1/admin/recent-products?limit=10
   */
  .get("/recent-products", async (c: Context) => {
    const guard = AdminGuard.ensureAdmin(c)
    if (guard) return guard
    const { limit } = validate.query(c, recentQuerySchema)
    try {
      const rows = await productsRepo.listRecent(limit)
      const items: readonly RecentProduct[] = rows.map((r) => ({
        id: r.id,
        name: r.name,
        slug: r.slug,
        priceCents: r.priceCents,
        currency: r.currency,
        imageUrl: r.imageUrl,
        createdAt: r.createdAt,
      }))
      return c.json({ items }, 200)
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load recent products"
      return c.json({ error: message }, 500)
    }
  })
  /**
   * GET /api/v1/admin/orders?status=pending&limit=50
   */
  .get("/orders", async (c: Context) => {
    const guard = AdminGuard.ensureAdmin(c)
    if (guard) return guard
    const schema = z.object({
      status: z.enum(["pending", "paid", "shipped", "delivered", "cancelled"]).optional(),
      limit: z.coerce.number().int().positive().max(200).optional().default(50),
    })
    const { status, limit } = validate.query(c, schema)
    try {
      const rows = await ordersRepo.listAll(limit, status)
      return c.json({ items: rows }, 200)
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load orders"
      return c.json({ error: message }, 500)
    }
  })
  /**
   * GET /api/v1/admin/orders/:id
   */
  .get("/orders/:id", async (c: Context) => {
    const guard = AdminGuard.ensureAdmin(c)
    if (guard) return guard
    const { id } = validate.params(c, z.object({ id: z.string().min(1) }))
    try {
      const row = await ordersRepo.byId(id)
      if (!row) return c.json({ error: "Not found" }, 404)
      return c.json(row, 200)
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load order"
      return c.json({ error: message }, 500)
    }
  })
  /**
   * PATCH /api/v1/admin/orders/:id/status
   * Body: { status }
   */
  .patch("/orders/:id/status", async (c: Context) => {
    const guard = AdminGuard.ensureAdmin(c)
    if (guard) return guard
    const { id } = validate.params(c, z.object({ id: z.string().min(1) }))
    const schema = z.object({
      status: z.enum(["pending", "paid", "shipped", "delivered", "cancelled"]),
    })
    const { status } = await validate.body(c, schema)
    try {
      const current = await ordersRepo.byId(id)
      if (!current) return c.json({ error: "Not found" }, 404)
      const prev = current.status
      const next = status
      const updated = await ordersRepo.updateStatus(id, next)
      if (!updated) return c.json({ error: "Not found" }, 404)
      try {
        if (next === "paid") {
          await inventoryRepo.commitOrder(id)
        } else if (next === "cancelled") {
          if (prev === "pending") {
            await inventoryRepo.releaseOrder(id)
          } else if (prev === "paid") {
            await inventoryRepo.restockOrder(id)
          }
        }
      } catch (invErr) {
        console.error("[admin] inventory side-effect failed", {
          orderId: id,
          error: invErr instanceof Error ? invErr.message : String(invErr),
        })
      }
      try {
        const email: string | null = updated.email ?? current.email
        if (email) {
          if (next === "paid") {
            await transactionalEmail.orderPaid({
              email,
              orderId: updated.id,
              totalCents: updated.totalCents,
            })
          } else if (next === "cancelled") {
            await transactionalEmail.orderCancelled({
              email,
              orderId: updated.id,
              totalCents: updated.totalCents,
            })
          } else if (next === "shipped") {
            await transactionalEmail.orderShipped({
              email,
              orderId: updated.id,
              totalCents: updated.totalCents,
            })
          }
        }
      } catch (mailErr) {
        console.error("[admin] email send failed", {
          orderId: id,
          error: mailErr instanceof Error ? mailErr.message : String(mailErr),
        })
      }
      return c.json(updated, 200)
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to update status"
      return c.json({ error: message }, 500)
    }
  })

export default adminRoute
