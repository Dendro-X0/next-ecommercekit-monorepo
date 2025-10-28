import { randomUUID } from "node:crypto"
import { and, asc, count, desc, eq, ilike, type SQL } from "drizzle-orm"
import { db } from "../db"
import { media as mediaTable } from "../schema/media"
import { productMedia } from "../schema/product-media"
import { products } from "../schema/products"

export type ListParams = Readonly<{
  query?: string
  category?: string
  sort?: "newest" | "price_asc" | "price_desc"
  page: number
  pageSize: number
  featured?: boolean
}>

export type RecentItem = Readonly<{
  id: string
  name: string
  slug: string
  priceCents: number
  currency: "USD"
  imageUrl?: string
  createdAt: string
}>

export type ProductDTO = Readonly<{
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

export type ListResponse = Readonly<{
  items: readonly ProductDTO[]
  total: number
  page: number
  pageSize: number
}>

function toIso(v: unknown): string {
  if (v instanceof Date) return v.toISOString()
  const s = typeof v === "string" ? v : String(v)
  const d = new Date(s)
  return Number.isFinite(d.getTime()) ? d.toISOString() : new Date().toISOString()
}

export type CreateProductInput = Readonly<{
  slug: string
  name: string
  priceCents: number
  currency?: "USD"
  imageUrl?: string
  description?: string
  categorySlug?: string
  featured?: boolean
  media?: ReadonlyArray<Readonly<{ url: string; kind: "image" | "video" }>>
  kind?: "digital" | "physical"
  shippingRequired?: boolean
  weightGrams?: number
  digitalVersion?: string
}>

export type UpdateProductInput = Readonly<{
  slug?: string
  name?: string
  priceCents?: number
  currency?: "USD"
  imageUrl?: string
  description?: string
  categorySlug?: string
  featured?: boolean
  media?: ReadonlyArray<Readonly<{ url: string; kind: "image" | "video" }>>
  kind?: "digital" | "physical"
  shippingRequired?: boolean
  weightGrams?: number
  digitalVersion?: string
}>

function buildWhere(params: ListParams): SQL | undefined {
  const filters: SQL[] = []
  if (params.query) {
    filters.push(ilike(products.name, `%${params.query}%`))
  }
  if (params.category) {
    filters.push(eq(products.categorySlug, params.category))
  }
  if (params.featured) {
    filters.push(eq(products.featured, true))
  }
  if (filters.length === 0) return undefined
  return and(...filters)
}

function mapRowToDto(row: typeof products.$inferSelect): ProductDTO {
  const media = Array.isArray(row.media)
    ? (row.media as ReadonlyArray<Readonly<{ url: string; kind: "image" | "video" }>>)
    : undefined
  const shippingRequired =
    typeof row.shippingRequired === "boolean" ? row.shippingRequired : undefined
  const weightGrams = typeof row.weightGrams === "number" ? row.weightGrams : undefined
  const kind: "digital" | "physical" | undefined =
    row.kind === "digital" || row.kind === "physical" ? row.kind : undefined
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    price: row.priceCents,
    currency: (row.currency as "USD") ?? "USD",
    imageUrl: row.imageUrl ?? undefined,
    description: row.description ?? undefined,
    categorySlug: row.categorySlug ?? undefined,
    featured: !!row.featured,
    media,
    kind,
    shippingRequired,
    weightGrams,
    digitalVersion: row.digitalVersion ?? undefined,
  } as const
}

async function listMediaForProduct(
  productId: string,
): Promise<ReadonlyArray<Readonly<{ url: string; kind: "image" | "video" }>>> {
  const rows = await db
    .select({ url: mediaTable.url, kind: mediaTable.kind, pos: productMedia.position })
    .from(productMedia)
    .innerJoin(mediaTable, eq(productMedia.mediaId, mediaTable.id))
    .where(eq(productMedia.productId, productId))
    .orderBy(asc(productMedia.position))
  return rows.map((r) => ({ url: r.url, kind: (r.kind as "image" | "video") ?? "image" }))
}

async function list(params: ListParams): Promise<ListResponse> {
  const page: number = Math.max(1, params.page)
  const pageSize: number = Math.min(100, Math.max(1, params.pageSize))
  const where = buildWhere(params)

  const order =
    params.sort === "price_asc"
      ? asc(products.priceCents)
      : params.sort === "price_desc"
        ? desc(products.priceCents)
        : desc(products.createdAt)

  const offset: number = (page - 1) * pageSize

  const [rows, totalRow] = await Promise.all([
    db.select().from(products).where(where).orderBy(order).limit(pageSize).offset(offset),
    db.select({ value: count() }).from(products).where(where),
  ])

  const total: number = totalRow[0]?.value ?? 0

  return {
    items: rows.map(mapRowToDto),
    total,
    page,
    pageSize,
  }
}

async function bySlug(slug: string): Promise<ProductDTO | null> {
  const rows = await db.select().from(products).where(eq(products.slug, slug)).limit(1)
  if (!rows.length) return null
  const base = mapRowToDto(rows[0])
  const relMedia = await listMediaForProduct(base.id)
  return relMedia.length > 0 ? { ...base, media: relMedia } : base
}

async function byId(id: string): Promise<ProductDTO | null> {
  const rows = await db.select().from(products).where(eq(products.id, id)).limit(1)
  if (!rows.length) return null
  const base = mapRowToDto(rows[0])
  const relMedia = await listMediaForProduct(base.id)
  return relMedia.length > 0 ? { ...base, media: relMedia } : base
}

async function listFeatured(limit: number): Promise<readonly ProductDTO[]> {
  const take: number = Math.min(100, Math.max(1, limit))
  const rows = await db
    .select()
    .from(products)
    .where(eq(products.featured, true))
    .orderBy(desc(products.createdAt))
    .limit(take)
  return rows.map(mapRowToDto)
}

async function listRecent(limit: number): Promise<readonly RecentItem[]> {
  const take: number = Math.min(100, Math.max(1, limit))
  const rows = await db
    .select({
      id: products.id,
      name: products.name,
      slug: products.slug,
      priceCents: products.priceCents,
      currency: products.currency,
      imageUrl: products.imageUrl,
      createdAt: products.createdAt,
    })
    .from(products)
    .orderBy(desc(products.createdAt))
    .limit(take)
  return rows.map(
    (r): RecentItem => ({
      id: r.id,
      name: r.name,
      slug: r.slug,
      priceCents: r.priceCents,
      currency: (r.currency as "USD") ?? "USD",
      imageUrl: r.imageUrl ?? undefined,
      createdAt: toIso(r.createdAt),
    }),
  )
}

async function create(input: CreateProductInput): Promise<ProductDTO> {
  const id: string = randomUUID()
  const row = (
    await db
      .insert(products)
      .values({
        id,
        slug: input.slug,
        name: input.name,
        priceCents: input.priceCents,
        currency: input.currency ?? "USD",
        imageUrl: input.imageUrl,
        description: input.description,
        categorySlug: input.categorySlug,
        featured: input.featured ?? false,
        media: input.media,
        kind: input.kind,
        shippingRequired:
          typeof input.shippingRequired === "boolean" ? input.shippingRequired : undefined,
        weightGrams: typeof input.weightGrams === "number" ? input.weightGrams : undefined,
        digitalVersion: input.digitalVersion,
      })
      .returning()
  )[0]
  // Adopt product_media relations (best-effort)
  if (Array.isArray(input.media) && input.media.length > 0) {
    let pos = 0
    for (const m of input.media) {
      // Try to find existing media row by URL, otherwise create a minimal one
      const existing = (
        await db
          .select({ id: mediaTable.id })
          .from(mediaTable)
          .where(eq(mediaTable.url, m.url))
          .limit(1)
      )[0]
      const mediaId = existing?.id ?? randomUUID()
      if (!existing) {
        await db.insert(mediaTable).values({
          id: mediaId,
          provider: "external",
          url: m.url,
          kind: m.kind,
        })
      }
      await db
        .insert(productMedia)
        .values({ id: randomUUID(), productId: id, mediaId, position: pos++ })
    }
  }
  return mapRowToDto(row)
}

async function update(id: string, patch: UpdateProductInput): Promise<ProductDTO | null> {
  const fields: Partial<typeof products.$inferInsert> = {}
  if (typeof patch.slug === "string") fields.slug = patch.slug
  if (typeof patch.name === "string") fields.name = patch.name
  if (typeof patch.priceCents === "number") fields.priceCents = patch.priceCents
  if (typeof patch.currency === "string") fields.currency = patch.currency
  if (typeof patch.imageUrl === "string") fields.imageUrl = patch.imageUrl
  if (typeof patch.description === "string") fields.description = patch.description
  if (typeof patch.categorySlug === "string") fields.categorySlug = patch.categorySlug
  if (typeof patch.featured === "boolean") fields.featured = patch.featured
  if (Array.isArray(patch.media)) fields.media = patch.media
  if (typeof patch.kind === "string") fields.kind = patch.kind
  if (typeof patch.shippingRequired === "boolean") fields.shippingRequired = patch.shippingRequired
  if (typeof patch.weightGrams === "number") fields.weightGrams = patch.weightGrams
  if (typeof patch.digitalVersion === "string") fields.digitalVersion = patch.digitalVersion
  if (Object.keys(fields).length === 0) {
    const current = await db.select().from(products).where(eq(products.id, id)).limit(1)
    if (!current.length) return null
    const base = mapRowToDto(current[0])
    const rel = await listMediaForProduct(id)
    return rel.length > 0 ? { ...base, media: rel } : base
  }
  const row = (await db.update(products).set(fields).where(eq(products.id, id)).returning())[0]
  if (!row) return null
  // If media patch was provided, replace relations
  if (Array.isArray(patch.media)) {
    await db.delete(productMedia).where(eq(productMedia.productId, id))
    let pos = 0
    for (const m of patch.media) {
      const existing = (
        await db
          .select({ id: mediaTable.id })
          .from(mediaTable)
          .where(eq(mediaTable.url, m.url))
          .limit(1)
      )[0]
      const mediaId = existing?.id ?? randomUUID()
      if (!existing) {
        await db
          .insert(mediaTable)
          .values({ id: mediaId, provider: "external", url: m.url, kind: m.kind })
      }
      await db
        .insert(productMedia)
        .values({ id: randomUUID(), productId: id, mediaId, position: pos++ })
    }
  }
  const base = mapRowToDto(row)
  const rel = await listMediaForProduct(id)
  return rel.length > 0 ? { ...base, media: rel } : base
}

async function remove(id: string): Promise<boolean> {
  // Cascade cleanup: remove product_media relations first, then product
  await db.delete(productMedia).where(eq(productMedia.productId, id))
  const res = await db.delete(products).where(eq(products.id, id)).returning({ id: products.id })
  return res.length > 0
}

/**
 * Admin stats helpers
 */
async function countAll(): Promise<number> {
  const r = await db.select({ value: count() }).from(products)
  return Number(r[0]?.value ?? 0)
}

async function countFeatured(): Promise<number> {
  const r = await db.select({ value: count() }).from(products).where(eq(products.featured, true))
  return Number(r[0]?.value ?? 0)
}

async function countByKind(kind: "digital" | "physical"): Promise<number> {
  const r = await db.select({ value: count() }).from(products).where(eq(products.kind, kind))
  return Number(r[0]?.value ?? 0)
}

async function latestCreatedAt(): Promise<string | undefined> {
  const r = await db
    .select({ createdAt: products.createdAt })
    .from(products)
    .orderBy(desc(products.createdAt))
    .limit(1)
  const v = r[0]?.createdAt
  return v ? toIso(v) : undefined
}

const productsRepo = {
  list,
  bySlug,
  byId,
  listFeatured,
  listRecent,
  create,
  update,
  remove,
  countAll,
  countFeatured,
  countByKind,
  latestCreatedAt,
} as const

export default productsRepo
