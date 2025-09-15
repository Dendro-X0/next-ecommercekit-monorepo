import { reviewsRepo } from "@repo/db"
import type { Context } from "hono"
import { Hono } from "hono"
import { z } from "zod"
import { validate } from "../lib/validate"

/**
 * Public reviews routes (read-only): list published reviews for a product.
 * One export per file: default hono sub-app.
 */

const querySchema = z.object({
  limit: z.coerce.number().int().positive().max(200).optional().default(50),
})

const paramsSchema = z.object({ productId: z.string().trim().min(1).max(100) })

const route = new Hono()
  /**
   * GET /api/v1/reviews/product/:productId?limit=50
   */
  .get("/product/:productId", async (c: Context) => {
    const { productId } = validate.params(c, paramsSchema)
    const { limit } = validate.query(c, querySchema)
    try {
      const items = await reviewsRepo.listByProduct(productId, limit)
      return c.json({ items }, 200)
    } catch (err) {
      const message: string = err instanceof Error ? err.message : "Failed to load reviews"
      return c.json({ error: message }, 500)
    }
  })

export default route
