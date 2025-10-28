import { reviewsRepo } from "@repo/db"
import type { Context } from "hono"
import { Hono } from "hono"
import { z } from "zod"
import { AdminGuard } from "../lib/admin-guard"
import { validate } from "../lib/validate"

/**
 * Admin routes for Reviews moderation.
 * One export per file: default hono sub-app.
 */

const listQuerySchema = z.object({
  status: z.enum(["Pending", "Published", "Rejected"]).optional(),
  productId: z.string().trim().min(1).max(100).optional(),
  userId: z.string().trim().min(1).max(100).optional(),
  limit: z.coerce.number().int().positive().max(200).optional().default(100),
})

const bodyStatusSchema = z.object({
  status: z.enum(["Pending", "Published", "Rejected"]),
})

const route = new Hono()
  /**
   * GET /api/v1/admin/reviews?status=Pending&productId=...&userId=...&limit=100
   */
  .get("/", async (c: Context) => {
    const guard = AdminGuard.ensureAdmin(c)
    if (guard) return guard
    const query = validate.query(c, listQuerySchema)
    try {
      const items = await reviewsRepo.adminList(query)
      return c.json({ items }, 200)
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load reviews"
      return c.json({ error: message }, 500)
    }
  })
  /**
   * PATCH /api/v1/admin/reviews/:id/status
   * Body: { status }
   */
  .patch(":id/status", async (c: Context) => {
    const guard = AdminGuard.ensureAdmin(c)
    if (guard) return guard
    const { id } = validate.params(c, z.object({ id: z.string().min(1) }))
    const { status } = await validate.body(c, bodyStatusSchema)
    try {
      const updated = await reviewsRepo.adminUpdateStatus(id, status)
      if (!updated) return c.json({ error: "Not found" }, 404)
      return c.json(updated, 200)
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to update status"
      return c.json({ error: message }, 500)
    }
  })

export default route
