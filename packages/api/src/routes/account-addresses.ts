import { addressesRepo } from "@repo/db"
import type { Context } from "hono"
/**
 * Account Addresses routes.
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
  type: z.enum(["shipping", "billing"]),
  name: z.string().trim().min(1).max(200),
  street: z.string().trim().min(1).max(200),
  city: z.string().trim().min(1).max(100),
  state: z.string().trim().min(1).max(100),
  zipCode: z.string().trim().min(1).max(20),
  country: z.string().trim().min(1).max(100),
  isDefault: z.boolean().optional(),
})

const updateBody = z.object({
  type: z.enum(["shipping", "billing"]).optional(),
  name: z.string().trim().min(1).max(200).optional(),
  street: z.string().trim().min(1).max(200).optional(),
  city: z.string().trim().min(1).max(100).optional(),
  state: z.string().trim().min(1).max(100).optional(),
  zipCode: z.string().trim().min(1).max(20).optional(),
  country: z.string().trim().min(1).max(100).optional(),
  isDefault: z.boolean().optional(),
})

const idParams = z.object({ id: z.string().trim().min(1).max(100) })

const accountAddressesRoute = new Hono()
  /**
   * GET /api/v1/account/addresses
   */
  .get("/", async (c: Context) => {
    const guard = ensureUser(c)
    if (guard) return guard
    const user = AdminGuard.getUser(c) as AppUser
    try {
      const items = await addressesRepo.listByUser(user.id)
      return c.json({ items }, 200)
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to list addresses"
      return c.json({ error: message }, 500)
    }
  })
  /**
   * POST /api/v1/account/addresses
   */
  .post("/", async (c: Context) => {
    const guard = ensureUser(c)
    if (guard) return guard
    const data = await validate.body(c, createBody)
    const user = AdminGuard.getUser(c) as AppUser
    try {
      const created = await addressesRepo.create(user.id, data)
      return c.json(created, 201)
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to create address"
      return c.json({ error: message }, 500)
    }
  })
  /**
   * PUT /api/v1/account/addresses/:id
   */
  .put(":id", async (c: Context) => {
    const guard = ensureUser(c)
    if (guard) return guard
    const { id } = validate.params(c, idParams)
    const data = await validate.body(c, updateBody)
    const user = AdminGuard.getUser(c) as AppUser
    try {
      const updated = await addressesRepo.update(user.id, id, data)
      if (!updated) return c.json({ error: "Address not found" }, 404)
      return c.json(updated, 200)
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to update address"
      return c.json({ error: message }, 500)
    }
  })
  /**
   * DELETE /api/v1/account/addresses/:id
   */
  .delete(":id", async (c: Context) => {
    const guard = ensureUser(c)
    if (guard) return guard
    const { id } = validate.params(c, idParams)
    const user = AdminGuard.getUser(c) as AppUser
    try {
      const ok = await addressesRepo.remove(user.id, id)
      if (!ok) return c.json({ error: "Address not found" }, 404)
      return c.json({ ok: true }, 200)
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to delete address"
      return c.json({ error: message }, 500)
    }
  })
  /**
   * POST /api/v1/account/addresses/:id/default
   */
  .post(":id/default", async (c: Context) => {
    const guard = ensureUser(c)
    if (guard) return guard
    const { id } = validate.params(c, idParams)
    const user = AdminGuard.getUser(c) as AppUser
    try {
      const ok = await addressesRepo.setDefault(user.id, id)
      if (!ok) return c.json({ error: "Address not found" }, 404)
      return c.json({ ok: true }, 200)
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to set default address"
      return c.json({ error: message }, 500)
    }
  })

export default accountAddressesRoute
