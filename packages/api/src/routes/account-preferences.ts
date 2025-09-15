import { preferencesRepo } from "@repo/db"
import type { Context } from "hono"
/**
 * Account Preferences routes.
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

const patchBody = z.object({
  newsletter: z.boolean().optional(),
  notifications: z.boolean().optional(),
  smsUpdates: z.boolean().optional(),
  theme: z.enum(["light", "dark", "system"]).optional(),
})

const accountPreferencesRoute = new Hono()
  /**
   * GET /api/v1/account/preferences
   */
  .get("/", async (c: Context) => {
    const guard = ensureUser(c)
    if (guard) return guard
    const user = AdminGuard.getUser(c) as AppUser
    try {
      const prefs = await preferencesRepo.getOrCreate(user.id)
      return c.json(prefs, 200)
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to get preferences"
      return c.json({ error: message }, 500)
    }
  })
  /**
   * PATCH /api/v1/account/preferences
   */
  .patch("/", async (c: Context) => {
    const guard = ensureUser(c)
    if (guard) return guard
    const data = await validate.body(c, patchBody)
    const user = AdminGuard.getUser(c) as AppUser
    try {
      const updated = await preferencesRepo.update(user.id, data)
      return c.json(updated, 200)
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to update preferences"
      return c.json({ error: message }, 500)
    }
  })

export default accountPreferencesRoute
