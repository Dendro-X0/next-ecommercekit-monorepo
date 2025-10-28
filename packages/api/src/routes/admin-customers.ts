import { customersRepo } from "@repo/db"
import type { Context } from "hono"
import { Hono } from "hono"
import { z } from "zod"
import { AdminGuard } from "../lib/admin-guard"
import { validate } from "../lib/validate"

/**
 * Admin Customers routes (list only for MVP)
 * One export per file: default hono sub-app.
 */

const listQuerySchema = z.object({
  query: z.string().trim().min(1).max(200).optional(),
  limit: z.coerce.number().int().positive().max(200).optional().default(50),
  page: z.coerce.number().int().positive().max(10000).optional().default(1),
})

const route = new Hono()
  /**
   * GET /api/v1/admin/customers?query=olivia&limit=50&page=1
   */
  .get("/", async (c: Context) => {
    const guard = AdminGuard.ensureAdmin(c)
    if (guard) return guard
    const parsed = validate.query(c, listQuerySchema)
    try {
      const items = await customersRepo.list(parsed)
      // Ensure ISO strings and stable shape
      const out = items.map((r) => ({
        id: r.id,
        name: r.name,
        email: r.email,
        imageUrl: r.imageUrl ?? undefined,
        createdAt: r.createdAt,
        ordersCount: r.ordersCount,
        totalSpentCents: r.totalSpentCents,
        status: r.status,
      }))
      return c.json({ items: out }, 200)
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load customers"
      return c.json({ error: message }, 500)
    }
  })

export default route
