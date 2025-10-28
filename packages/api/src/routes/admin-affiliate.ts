import { affiliateRepo } from "@repo/db"
import type { Context } from "hono"
import { Hono } from "hono"
import { z } from "zod"
import { AdminGuard } from "../lib/admin-guard"
import { validate } from "../lib/validate"

/**
 * Admin routes for Affiliate management (conversions only for MVP).
 * One export per file: default hono sub-app.
 */

const conversionsQuerySchema = z.object({
  status: z.enum(["pending", "approved", "paid"]).optional(),
  limit: z.coerce.number().int().positive().max(200).optional().default(50),
})

const bodyStatusSchema = z.object({
  status: z.enum(["pending", "approved", "paid"]),
})

const route = new Hono()
  /**
   * GET /api/v1/admin/affiliate/conversions?status=pending&limit=50
   */
  .get("/conversions", async (c: Context) => {
    const guard = AdminGuard.ensureAdmin(c)
    if (guard) return guard
    const { status, limit } = validate.query(c, conversionsQuerySchema)
    try {
      const items = await affiliateRepo.listConversionsAdmin({ status, limit })
      const out = items.map((it) => ({
        id: it.id,
        clickId: it.clickId,
        orderId: it.orderId,
        userId: it.userId,
        code: it.code,
        commissionCents: it.commissionCents,
        status: it.status,
        createdAt: it.createdAt.toISOString(),
        paidAt: it.paidAt ? it.paidAt.toISOString() : null,
      }))
      return c.json({ items: out }, 200)
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load conversions"
      return c.json({ error: message }, 500)
    }
  })
  /**
   * PATCH /api/v1/admin/affiliate/conversions/:id/status
   * Body: { status }
   */
  .patch("/conversions/:id/status", async (c: Context) => {
    const guard = AdminGuard.ensureAdmin(c)
    if (guard) return guard
    const { id } = validate.params(c, z.object({ id: z.string().min(1) }))
    const { status } = await validate.body(c, bodyStatusSchema)
    try {
      const existing = await affiliateRepo.getConversionById({ id })
      if (!existing) return c.json({ error: "Not found" }, 404)
      const paidAt = status === "paid" ? new Date() : null
      await affiliateRepo.updateConversionStatus({ id, status, paidAt })
      const actor = AdminGuard.getUser(c)
      await affiliateRepo.appendConversionEvent({
        conversionId: id,
        actorEmail: actor?.email ?? null,
        action: "status_change",
        fromStatus: existing.status,
        toStatus: status,
      })
      const updated = await affiliateRepo.getConversionById({ id })
      const res = updated
        ? {
            id: updated.id,
            clickId: updated.clickId,
            orderId: updated.orderId,
            userId: updated.userId,
            code: updated.code,
            commissionCents: updated.commissionCents,
            status: updated.status,
            createdAt: updated.createdAt.toISOString(),
            paidAt: updated.paidAt ? updated.paidAt.toISOString() : null,
          }
        : null
      return c.json(res, 200)
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to update status"
      return c.json({ error: message }, 500)
    }
  })

export default route
