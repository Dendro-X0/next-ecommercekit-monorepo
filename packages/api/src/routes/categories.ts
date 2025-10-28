import { categoriesRepo } from "@repo/db"
import type { Context } from "hono"
/**
 * Categories routes for the Shop API.
 */
import { Hono } from "hono"

const categoriesRoute = new Hono()
  /**
   * GET /api/v1/categories
   */
  .get("/", async (c: Context) => {
    try {
      const items = await categoriesRepo.list()
      // Cache for 60s at the edge, allow 5 minutes stale-while-revalidate
      c.header("Cache-Control", "public, s-maxage=60, stale-while-revalidate=300")
      return c.json({ items }, 200)
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to list categories"
      return c.json({ error: message }, 500)
    }
  })

export default categoriesRoute
