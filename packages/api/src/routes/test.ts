import { affiliateRepo, productsRepo } from "@repo/db"
import type { Context } from "hono"
import { Hono } from "hono"

/**
 * Dev-only test utilities. Do not mount in production.
 */
const testRoute = new Hono()
  .get("/first-product-slug", async (c: Context) => {
    try {
      const result = await productsRepo.list({ page: 1, pageSize: 1 })
      const slug: string | undefined = result.items[0]?.slug
      if (!slug) return c.json({ error: "No products available" }, 404)
      return c.json({ slug }, 200)
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to fetch slug"
      return c.json({ error: message }, 500)
    }
  })
  .get("/affiliate/last-conversion", async (c: Context) => {
    try {
      const items = await affiliateRepo.listConversionsAdmin({ limit: 1 })
      const conv = items[0]
      if (!conv) return c.json({ error: "No conversions" }, 404)
      return c.json(
        {
          id: conv.id,
          orderId: conv.orderId,
          clickId: conv.clickId,
          code: conv.code,
          status: conv.status,
          commissionCents: conv.commissionCents,
          createdAt: conv.createdAt.toISOString(),
        },
        200,
      )
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to fetch conversion"
      return c.json({ error: message }, 500)
    }
  })

export default testRoute
