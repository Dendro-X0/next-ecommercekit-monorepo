import { createHash } from "node:crypto"
import { affiliateRepo } from "@repo/db"
import { Hono } from "hono"
import { z } from "zod"
import { AdminGuard } from "../lib/admin-guard"
import { validate } from "../lib/validate"

/**
 * Affiliate API routes
 */

type AppUser = Readonly<{ id: string; email?: string }> // narrow usage for this route

const COOKIE = "AFF_REF" as const

// Use AdminGuard.getUser for consistency across routes

const trackBody = z.object({
  code: z.string().min(4),
  source: z.string().min(1).max(120).optional(),
})

const route = new Hono()
  /**
   * POST /api/v1/affiliate/track
   * Body: { code, source? }
   */
  .post("/track", async (c) => {
    const { code, source } = await validate.body(c, trackBody)
    const user = AdminGuard.getUser(c) as AppUser | null
    const ua: string = c.req.header("user-agent") ?? ""
    const ipHeader: string | null = (c.req.header("x-forwarded-for") as string | null) ?? null
    const ip: string = ipHeader ? ipHeader.split(",")[0]!.trim() : "0.0.0.0"
    // Simple hashes (server; uniqueness/coalescing only)
    const userAgentHash: string = sha256(ua)
    const ipHash: string = sha256(ip)
    try {
      const click = await affiliateRepo.createClick({
        code,
        userId: user?.id ?? null,
        userAgentHash,
        ipHash,
        source: source ?? null,
      })
      // Set referral cookie for 30 days
      c.header(
        "Set-Cookie",
        `${COOKIE}=${encodeURIComponent(code)}; Path=/; SameSite=Lax; Max-Age=${60 * 60 * 24 * 30}`,
      )
      return c.json({ id: click.id, createdAt: click.createdAt.toISOString() }, 201)
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to track click"
      return c.json({ error: message }, 500)
    }
  })
  /**
   * GET /api/v1/affiliate/me
   * Returns profile (auto-upsert) + summary stats
   */
  .get("/me", async (c) => {
    const user = AdminGuard.getUser(c) as AppUser | null
    if (!user) return c.json({ error: "Unauthorized" }, 401)
    try {
      const profile = await affiliateRepo.upsertForUser({ userId: user.id })
      const summary = await affiliateRepo.getSummaryForCode({ code: profile.code })
      return c.json({ profile: { id: profile.id, code: profile.code }, stats: summary }, 200)
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load profile"
      return c.json({ error: message }, 500)
    }
  })
  /**
   * POST /api/v1/affiliate/me/code
   */
  .post("/me/code", async (c) => {
    const user = AdminGuard.getUser(c) as AppUser | null
    if (!user) return c.json({ error: "Unauthorized" }, 401)
    try {
      const profile = await affiliateRepo.regenerateCode({ userId: user.id })
      return c.json({ profile: { id: profile.id, code: profile.code } }, 200)
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to regenerate code"
      return c.json({ error: message }, 500)
    }
  })
  /**
   * GET /api/v1/affiliate/me/clicks
   */
  .get("/me/clicks", async (c) => {
    const user = AdminGuard.getUser(c) as AppUser | null
    if (!user) return c.json({ error: "Unauthorized" }, 401)
    try {
      const profile = await affiliateRepo.upsertForUser({ userId: user.id })
      const clicks = await affiliateRepo.listClicksByCode({ code: profile.code, limit: 50 })
      const items = clicks.map((r) => ({
        id: r.id,
        date: r.createdAt.toISOString(),
        source: r.source ?? null,
      }))
      return c.json({ items }, 200)
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to list clicks"
      return c.json({ error: message }, 500)
    }
  })
  /**
   * GET /api/v1/affiliate/me/conversions
   */
  .get("/me/conversions", async (c) => {
    const user = AdminGuard.getUser(c) as AppUser | null
    if (!user) return c.json({ error: "Unauthorized" }, 401)
    try {
      const profile = await affiliateRepo.upsertForUser({ userId: user.id })
      const conversions = await affiliateRepo.listConversionsByCode({
        code: profile.code,
        limit: 50,
      })
      const items = conversions.map((r) => ({
        id: r.id,
        orderId: r.orderId,
        commissionCents: r.commissionCents,
        status: r.status,
        createdAt: r.createdAt.toISOString(),
      }))
      return c.json({ items }, 200)
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to list conversions"
      return c.json({ error: message }, 500)
    }
  })

function sha256(input: string): string {
  return createHash("sha256").update(input).digest("hex")
}

export default route
