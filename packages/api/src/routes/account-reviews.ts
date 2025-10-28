import { reviewsRepo } from "@repo/db"
import type { Context } from "hono"
/**
 * Account Reviews routes (CRUD for the authenticated user's reviews).
 */
import { Hono } from "hono"
import { z } from "zod"
import { AdminGuard } from "../lib/admin-guard"
import { validate } from "../lib/validate"

/** Minimal user shape extracted from Better Auth session. */
type AppUser = Readonly<{ id: string }>

function ensureUser(c: Context): Response | null {
  const u = AdminGuard.getUser(c) as AppUser | null
  if (!u) return c.json({ error: "Unauthorized" }, 401)
  return null
}

const createBody = z.object({
  productId: z.string().trim().min(1).max(100),
  rating: z.coerce.number().int().min(1).max(5),
  title: z.string().trim().min(1).max(200).optional(),
  content: z.string().trim().min(1).max(5000).optional(),
})

const updateBody = z.object({
  rating: z.coerce.number().int().min(1).max(5).optional(),
  title: z.string().trim().min(1).max(200).optional(),
  content: z.string().trim().min(1).max(5000).optional(),
})

const idParams = z.object({ id: z.string().trim().min(1).max(100) })

const route = new Hono()
  /**
   * GET /api/v1/account/reviews
   */
  .get("/", async (c: Context) => {
    const guard = ensureUser(c)
    if (guard) return guard
    const user = AdminGuard.getUser(c) as AppUser
    try {
      const items = await reviewsRepo.listByUser(user.id)
      return c.json({ items }, 200)
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to list reviews"
      return c.json({ error: message }, 500)
    }
  })
  /**
   * POST /api/v1/account/reviews
   */
  .post("/", async (c: Context) => {
    const guard = ensureUser(c)
    if (guard) return guard
    const data = await validate.body(c, createBody)
    const user = AdminGuard.getUser(c) as AppUser
    try {
      const created = await reviewsRepo.create({
        userId: user.id,
        productId: data.productId,
        rating: data.rating,
        title: data.title,
        content: data.content,
      })
      return c.json(created, 201)
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to create review"
      return c.json({ error: message }, 500)
    }
  })
  /**
   * PUT /api/v1/account/reviews/:id
   */
  .put(":id", async (c: Context) => {
    const guard = ensureUser(c)
    if (guard) return guard
    const { id } = validate.params(c, idParams)
    const data = await validate.body(c, updateBody)
    const user = AdminGuard.getUser(c) as AppUser
    try {
      const existing = await reviewsRepo.byId(id)
      if (!existing || existing.userId !== user.id) return c.json({ error: "Not found" }, 404)
      const updated = await reviewsRepo.update(id, data)
      return c.json(updated, 200)
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to update review"
      return c.json({ error: message }, 500)
    }
  })
  /**
   * DELETE /api/v1/account/reviews/:id
   */
  .delete(":id", async (c: Context) => {
    const guard = ensureUser(c)
    if (guard) return guard
    const { id } = validate.params(c, idParams)
    const user = AdminGuard.getUser(c) as AppUser
    try {
      const existing = await reviewsRepo.byId(id)
      if (!existing || existing.userId !== user.id) return c.json({ error: "Not found" }, 404)
      const ok = await reviewsRepo.remove(id)
      if (!ok) return c.json({ error: "Failed to delete" }, 500)
      return c.json({ ok: true }, 200)
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to delete review"
      return c.json({ error: message }, 500)
    }
  })

export default route
