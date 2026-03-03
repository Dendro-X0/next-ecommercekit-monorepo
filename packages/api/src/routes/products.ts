import { getCatalogAdapter } from "../catalog"
import type { Context } from "hono"
/**
 * Products routes for the Shop API.
 *
 * Exposes read-only product listing and detail endpoints.
 * Later, wire these to Drizzle models.
 */
import { Hono } from "hono"
import { z } from "zod"
import { AdminGuard } from "../lib/admin-guard"
import { validate } from "../lib/validate"

/**
 * Query schema for listing products.
 */
const listQuerySchema = z.object({
  query: z.string().trim().min(1).max(200).optional(),
  category: z.string().trim().min(1).max(100).optional(),
  sort: z.enum(["newest", "price_asc", "price_desc"]).optional().default("newest"),
  page: z.coerce.number().int().positive().optional().default(1),
  pageSize: z.coerce.number().int().positive().max(100).optional().default(20),
  featured: z.coerce.boolean().optional(),
})

/**
 * Params schema for product detail.
 */
const paramsSchema = z.object({
  slug: z.string().trim().min(1).max(200),
})

/**
 * Params schema for product by id.
 */
const idParamsSchema = z.object({
  id: z.string().trim().min(1).max(200),
})

/**
 * Query schema for featured listing.
 */
const featuredQuerySchema = z.object({
  limit: z.coerce.number().int().positive().max(100).optional().default(8),
})

/**
 * Lightweight product DTO returned by the API.
 */
type ProductDTO = Readonly<{
  id: string
  slug: string
  name: string
  price: number // cents
  currency: "USD"
  imageUrl?: string
  description?: string
  categorySlug?: string
  featured: boolean
  media?: ReadonlyArray<Readonly<{ url: string; kind: "image" | "video" }>>
  kind?: "digital" | "physical"
  shippingRequired?: boolean
  weightGrams?: number
  digitalVersion?: string
}>

/**
 * RO-RO response for list endpoint.
 */
type ProductListResponse = Readonly<{
  items: readonly ProductDTO[]
  total: number
  page: number
  pageSize: number
}>

function toProductDTO(p: {
  readonly id: string
  readonly slug: string
  readonly name: string
  readonly priceCents: number
  readonly currency: "USD"
  readonly imageUrl?: string
  readonly description?: string
  readonly categorySlug?: string
  readonly featured: boolean
  readonly media?: ReadonlyArray<Readonly<{ url: string; kind: "image" | "video" }>>
  readonly kind?: "digital" | "physical"
  readonly shippingRequired?: boolean
  readonly weightGrams?: number
  readonly digitalVersion?: string
}): ProductDTO {
  return {
    id: p.id,
    slug: p.slug,
    name: p.name,
    price: p.priceCents,
    currency: p.currency,
    imageUrl: p.imageUrl,
    description: p.description,
    categorySlug: p.categorySlug,
    featured: p.featured,
    media: p.media,
    kind: p.kind,
    shippingRequired: p.shippingRequired,
    weightGrams: p.weightGrams,
    digitalVersion: p.digitalVersion,
  }
}

/**
 * Hono sub-app for products.
 */
type AppUser = Readonly<{
  id: string
  email?: string
  role?: string
  roles?: readonly string[]
  isAdmin?: boolean
}>

const urlOrPath = z
  .string()
  .trim()
  .refine((v) => /^https?:\/\//.test(v) || v.startsWith("/"), {
    message: "Must be an absolute URL or start with /",
  })

const createBodySchema = z.object({
  slug: z.string().trim().min(1).max(200),
  name: z.string().trim().min(1).max(200),
  priceCents: z.number().int().min(0),
  currency: z.literal("USD").optional(),
  imageUrl: urlOrPath.optional(),
  description: z.string().trim().min(1).max(5000).optional(),
  categorySlug: z.string().trim().min(1).max(100).optional(),
  featured: z.boolean().optional(),
  media: z
    .array(
      z.object({
        url: urlOrPath,
        kind: z.enum(["image", "video"]),
      }),
    )
    .max(50)
    .optional(),
  kind: z.enum(["digital", "physical"]).optional(),
  shippingRequired: z.boolean().optional(),
  weightGrams: z.number().int().min(0).optional(),
  digitalVersion: z.string().trim().min(1).max(50).optional(),
})

const updateBodySchema = z.object({
  slug: z.string().trim().min(1).max(200).optional(),
  name: z.string().trim().min(1).max(200).optional(),
  priceCents: z.number().int().min(0).optional(),
  currency: z.literal("USD").optional(),
  imageUrl: urlOrPath.optional(),
  description: z.string().trim().min(1).max(5000).optional(),
  categorySlug: z.string().trim().min(1).max(100).optional(),
  featured: z.boolean().optional(),
  media: z
    .array(
      z.object({
        url: urlOrPath,
        kind: z.enum(["image", "video"]),
      }),
    )
    .max(50)
    .optional(),
  kind: z.enum(["digital", "physical"]).optional(),
  shippingRequired: z.boolean().optional(),
  weightGrams: z.number().int().min(0).optional(),
  digitalVersion: z.string().trim().min(1).max(50).optional(),
})

// Use shared AdminGuard from `../lib/admin-guard` for consistent policy.

const productsRoute = new Hono()
  /**
   * GET /api/v1/products
   * List products with basic filtering and pagination.
   */
  .get("/", async (c: Context) => {
    const q = validate.query(c, listQuerySchema)
    try {
      const adapter = getCatalogAdapter()
      const result = await adapter.listProducts({
        query: q.query,
        category: q.category,
        sort: q.sort,
        page: q.page,
        pageSize: q.pageSize,
        featured: q.featured,
      })
      // Cache list responses briefly at the edge to reduce cold-start load
      c.header("Cache-Control", "public, s-maxage=60, stale-while-revalidate=300")
      const res: ProductListResponse = {
        items: result.items.map(toProductDTO),
        total: result.total,
        page: result.page,
        pageSize: result.pageSize,
      }
      return c.json(res, 200)
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to list products"
      return c.json({ error: message }, 500)
    }
  })
  /**
   * GET /api/v1/products/featured?limit=8
   * List featured products (simple curated subset).
   */
  .get("/featured", async (c: Context) => {
    const { limit } = validate.query(c, featuredQuerySchema)
    try {
      const adapter = getCatalogAdapter()
      const items = await adapter.listFeaturedProducts(limit)
      c.header("Cache-Control", "public, s-maxage=60, stale-while-revalidate=300")
      return c.json({ items: items.map(toProductDTO) }, 200)
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to list featured products"
      return c.json({ error: message }, 500)
    }
  })
  /**
   * GET /api/v1/products/id/:id
   * Fetch a single product by id.
   */
  .get("/id/:id", async (c: Context) => {
    const { id } = validate.params(c, idParamsSchema)
    try {
      const adapter = getCatalogAdapter()
      const product = await adapter.getProductById(id)
      if (!product) {
        return c.json({ error: "Product not found" }, 404)
      }
      c.header("Cache-Control", "public, s-maxage=120, stale-while-revalidate=600")
      return c.json(toProductDTO(product), 200)
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to fetch product"
      return c.json({ error: message }, 500)
    }
  })
  /**
   * GET /api/v1/products/:slug
   * Fetch a single product by slug.
   */
  .get("/:slug", async (c: Context) => {
    const { slug } = validate.params(c, paramsSchema)
    try {
      const adapter = getCatalogAdapter()
      const product = await adapter.getProductBySlug(slug)
      if (!product) {
        return c.json({ error: "Product not found" }, 404)
      }
      c.header("Cache-Control", "public, s-maxage=120, stale-while-revalidate=600")
      return c.json(toProductDTO(product), 200)
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to fetch product"
      return c.json({ error: message }, 500)
    }
  })
  /**
   * POST /api/v1/products
   * Create a product (admin only).
   */
  .post("/", async (c: Context) => {
    const guard = AdminGuard.ensureAdmin(c)
    if (guard) return guard
    const adapter = getCatalogAdapter()
    if (!adapter.capabilities.supportsWrite) {
      return c.json({ error: "Catalog provider is read-only" }, 400)
    }
    const data = await validate.body(c, createBodySchema)
    try {
      // Pre-check slug uniqueness to provide a friendly error before DB constraint.
      const existing = await adapter.getProductBySlug(data.slug)
      if (existing) {
        return c.json({ error: "Slug already exists. Please choose a different slug." }, 409)
      }
      const created = await adapter.createProduct({
        slug: data.slug,
        name: data.name,
        priceCents: data.priceCents,
        currency: data.currency ?? "USD",
        imageUrl: data.imageUrl,
        description: data.description,
        categorySlug: data.categorySlug,
        featured: data.featured ?? false,
        media: data.media,
        kind: data.kind,
        shippingRequired: data.shippingRequired,
        weightGrams: data.weightGrams,
        digitalVersion: data.digitalVersion,
      })
      return c.json(toProductDTO(created), 201)
    } catch (err) {
      const raw = err instanceof Error ? err.message : String(err)
      const message = raw || "Failed to create product"
      const isUnique = /duplicate key value|unique constraint/i.test(message)
      if (isUnique) {
        return c.json({ error: "Slug already exists. Please choose a different slug." }, 409)
      }
      return c.json({ error: message }, 500)
    }
  })
  /**
   * PUT /api/v1/products/:id
   * Update a product (admin only).
   */
  .put("/:id", async (c: Context) => {
    const guard = AdminGuard.ensureAdmin(c)
    if (guard) return guard
    const adapter = getCatalogAdapter()
    if (!adapter.capabilities.supportsWrite) {
      return c.json({ error: "Catalog provider is read-only" }, 400)
    }
    const { id } = validate.params(c, idParamsSchema)
    const data = await validate.body(c, updateBodySchema)
    try {
      const updated = await adapter.updateProduct(id, {
        slug: data.slug,
        name: data.name,
        priceCents: data.priceCents,
        currency: data.currency,
        imageUrl: data.imageUrl,
        description: data.description,
        categorySlug: data.categorySlug,
        featured: data.featured,
        media: data.media,
        kind: data.kind,
        shippingRequired: data.shippingRequired,
        weightGrams: data.weightGrams,
        digitalVersion: data.digitalVersion,
      })
      if (!updated) return c.json({ error: "Product not found" }, 404)
      return c.json(toProductDTO(updated), 200)
    } catch (err) {
      const raw = err instanceof Error ? err.message : String(err)
      const message = raw || "Failed to update product"
      const isUnique = /duplicate key value|unique constraint/i.test(message)
      if (isUnique) {
        return c.json({ error: "Slug already exists. Please choose a different slug." }, 409)
      }
      return c.json({ error: message }, 500)
    }
  })
  /**
   * DELETE /api/v1/products/:id
   * Delete a product (admin only).
   */
  .delete("/:id", async (c: Context) => {
    const guard = AdminGuard.ensureAdmin(c)
    if (guard) return guard
    const adapter = getCatalogAdapter()
    if (!adapter.capabilities.supportsWrite) {
      return c.json({ error: "Catalog provider is read-only" }, 400)
    }
    const { id } = validate.params(c, idParamsSchema)
    try {
      const ok = await adapter.deleteProduct(id)
      if (!ok) return c.json({ error: "Product not found" }, 404)
      return c.json({ ok: true }, 200)
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to delete product"
      return c.json({ error: message }, 500)
    }
  })

export default productsRoute
