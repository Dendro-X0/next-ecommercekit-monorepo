/**
 * Products API client.
 * One export per file: `productsApi`.
 */

import { products as localProducts } from "@/lib/data"
import type { Product } from "@/types"

export type ListProductsParams = Readonly<{
  query?: string
  category?: string
  sort?: string
  page?: number
  pageSize?: number
  featured?: boolean
}>

// Internal server DTOs (cents). Do NOT export.
type ServerProductDto = Readonly<{
  id: string
  slug: string
  name: string
  price: number // cents
  currency: "USD"
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

type ServerListResponse = Readonly<{
  items: readonly ServerProductDto[]
  total: number
  page: number
  pageSize: number
}>

export type ListProductsResponse = Readonly<{
  items: readonly Product[]
  page: number
  pageSize: number
  total: number
}>

const API_BASE: string = "/api/v1"

// Safe-mode flags: when enabled, avoid all network requests and return static data.
const RAW_ENV: string = process.env.NODE_ENV ?? "development"
const DISABLE_DATA_FETCH: boolean =
  RAW_ENV === "production"
    ? false
    : (process.env.NEXT_PUBLIC_DISABLE_DATA_FETCH ?? "false").toLowerCase() === "true"
const DISABLE_PRODUCTS: boolean =
  RAW_ENV === "production"
    ? false
    : DISABLE_DATA_FETCH ||
      (process.env.NEXT_PUBLIC_DISABLE_PRODUCTS ?? "false").toLowerCase() === "true"

function localProductsList(params: ListProductsParams = {}): ListProductsResponse {
  const pageSize: number = Math.max(1, Math.min(100, params.pageSize ?? 12))
  const page: number = Math.max(1, params.page ?? 1)
  const category = params.category?.toLowerCase()
  let items = [...localProducts]
  if (category) {
    items = items.filter((p) => p.category?.toLowerCase() === category)
  }
  // Very light client-side sort for demo; defaults to input order
  if (params.sort === "price_asc") items.sort((a, b) => a.price - b.price)
  if (params.sort === "price_desc") items.sort((a, b) => b.price - a.price)
  const total = items.length
  const start = (page - 1) * pageSize
  const slice = items.slice(start, start + pageSize)
  return { items: slice, total, page, pageSize }
}

async function asJson<T>(res: Response): Promise<T> {
  const ct: string | null = res.headers.get("content-type")
  const isJson: boolean = !!ct && ct.includes("application/json")
  const body: unknown = isJson ? await res.json() : undefined
  if (!res.ok) {
    const message: string =
      (body as { readonly error?: string })?.error ?? `Request failed (${res.status})`
    throw new Error(message)
  }
  return body as T
}

const centsToDollars = (cents: number): number => Math.round(cents) / 100

function humanizeSlug(slug?: string): string | undefined {
  if (!slug || typeof slug !== "string") return undefined
  const name: string = slug
    .trim()
    .replaceAll("-", " ")
    .replace(/\s+/g, " ")
    .replace(/\b\w/g, (m) => m.toUpperCase())
  return name.length > 0 ? name : undefined
}

function mapServerToProduct(dto: ServerProductDto): Product {
  const fallback = localProducts.find((p) => p.slug === dto.slug)
  const mediaImages: string[] = Array.isArray(dto.media)
    ? dto.media
        .filter((m) => m.kind === "image")
        .map((m) => m.url)
        .filter((u) => !!u && u.trim().length > 0)
    : []
  const primaryImages: string[] =
    mediaImages.length > 0
      ? mediaImages
      : typeof dto.imageUrl === "string" && dto.imageUrl.trim().length > 0
        ? [dto.imageUrl]
        : []
  const images: string[] =
    primaryImages.length > 0 ? primaryImages : (fallback?.images ?? ["/placeholder.svg"])
  const description: string =
    (typeof dto.description === "string" && dto.description.trim().length > 0
      ? dto.description
      : undefined) ??
    fallback?.description ??
    "Product description coming soon."
  return {
    id: dto.id,
    name: dto.name ?? fallback?.name ?? dto.slug,
    price: centsToDollars(dto.price),
    originalPrice: fallback?.originalPrice,
    description,
    images,
    // Prefer server category slug (humanized) so custom/manual categories show up.
    category: humanizeSlug(dto.categorySlug) ?? fallback?.category ?? "General",
    slug: dto.slug,
    inStock: fallback?.inStock ?? true,
    rating: fallback?.rating ?? 4.5,
    reviewCount: fallback?.reviewCount ?? 0,
    tags: fallback?.tags ?? [],
    kind: dto.kind ?? fallback?.kind,
    digital:
      dto.kind === "digital" || fallback?.kind === "digital"
        ? {
            ...(fallback?.digital ?? {}),
            version: dto.digitalVersion ?? fallback?.digital?.version,
          }
        : fallback?.digital,
  }
}

export const productsApi = {
  list: async (params: ListProductsParams = {}): Promise<ListProductsResponse> => {
    if (DISABLE_PRODUCTS) {
      return Promise.resolve(localProductsList(params))
    }
    const usp = new URLSearchParams()
    if (params.query) usp.set("query", params.query)
    if (params.category) usp.set("category", params.category)
    if (params.sort) usp.set("sort", params.sort)
    if (typeof params.page === "number") usp.set("page", String(params.page))
    if (typeof params.pageSize === "number") usp.set("pageSize", String(params.pageSize))
    if (typeof params.featured === "boolean") usp.set("featured", String(params.featured))
    const res: Response = await fetch(`${API_BASE}/products?${usp.toString()}`, {
      credentials: "include",
    })
    const server: ServerListResponse = await asJson<ServerListResponse>(res)
    return {
      items: server.items.map(mapServerToProduct),
      total: server.total,
      page: server.page,
      pageSize: server.pageSize,
    }
  },
  featured: async (limit = 8): Promise<Readonly<{ items: readonly Product[] }>> => {
    if (DISABLE_PRODUCTS) {
      const n: number = Math.max(1, Math.min(50, limit))
      return Promise.resolve({ items: localProducts.slice(0, n) } as const)
    }
    const usp = new URLSearchParams()
    if (typeof limit === "number" && Number.isFinite(limit)) usp.set("limit", String(limit))
    const res: Response = await fetch(`${API_BASE}/products/featured?${usp.toString()}`, {
      credentials: "include",
    })
    const json: Readonly<{ items: readonly ServerProductDto[] }> =
      await asJson<Readonly<{ items: readonly ServerProductDto[] }>>(res)
    return { items: (json.items ?? []).map(mapServerToProduct) } as const
  },
  bySlug: async (slug: string): Promise<Product> => {
    if (DISABLE_PRODUCTS) {
      const local = localProducts.find((p) => p.slug === slug) ?? localProducts[0]
      return Promise.resolve(local)
    }
    const res: Response = await fetch(`${API_BASE}/products/${encodeURIComponent(slug)}`, {
      credentials: "include",
    })
    const dto: ServerProductDto = await asJson<ServerProductDto>(res)
    return mapServerToProduct(dto)
  },
  byId: async (id: string): Promise<Product> => {
    if (DISABLE_PRODUCTS) {
      const local = localProducts.find((p) => p.id === id) ?? localProducts[0]
      return Promise.resolve(local)
    }
    const res: Response = await fetch(`${API_BASE}/products/id/${encodeURIComponent(id)}`, {
      credentials: "include",
    })
    const dto: ServerProductDto = await asJson<ServerProductDto>(res)
    return mapServerToProduct(dto)
  },
  /**
   * Fetches the raw server DTO for a product by id. Includes imageUrl and media gallery.
   * Intended for admin/edit forms that need exact server fields.
   */
  byIdDto: async (
    id: string,
  ): Promise<
    Readonly<{
      id: string
      slug: string
      name: string
      price: number
      currency: "USD"
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
  > => {
    const res: Response = await fetch(`${API_BASE}/products/id/${encodeURIComponent(id)}`, {
      credentials: "include",
    })
    const dto: ServerProductDto = await asJson<ServerProductDto>(res)
    return dto
  },
  create: async (
    input: Readonly<{
      name: string
      slug: string
      price: number
      categorySlug?: string
      imageUrl?: string
      description?: string
      featured?: boolean
      media?: ReadonlyArray<Readonly<{ url: string; kind: "image" | "video" }>>
      kind?: "digital" | "physical"
      shippingRequired?: boolean
      weightKg?: number
      digitalVersion?: string
    }>,
  ): Promise<Product> => {
    const body = {
      slug: input.slug,
      name: input.name,
      priceCents: Math.round(input.price * 100),
      currency: "USD" as const,
      imageUrl: input.imageUrl,
      description: input.description,
      categorySlug: input.categorySlug,
      featured: input.featured ?? false,
      media: input.media,
      kind: input.kind,
      shippingRequired:
        typeof input.shippingRequired === "boolean" ? input.shippingRequired : undefined,
      weightGrams:
        typeof input.weightKg === "number" ? Math.round(input.weightKg * 1000) : undefined,
      digitalVersion: input.digitalVersion,
    }
    const res: Response = await fetch(`${API_BASE}/products`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      credentials: "include",
      body: JSON.stringify(body),
    })
    const dto: ServerProductDto = await asJson<ServerProductDto>(res)
    return mapServerToProduct(dto)
  },
  updateById: async (
    id: string,
    patch: Readonly<{
      name?: string
      slug?: string
      price?: number
      categorySlug?: string
      imageUrl?: string
      description?: string
      featured?: boolean
      media?: ReadonlyArray<Readonly<{ url: string; kind: "image" | "video" }>>
      kind?: "digital" | "physical"
      shippingRequired?: boolean
      weightKg?: number
      digitalVersion?: string
    }>,
  ): Promise<Product> => {
    const body: Record<string, unknown> = {}
    if (typeof patch.slug === "string") body.slug = patch.slug
    if (typeof patch.name === "string") body.name = patch.name
    if (typeof patch.price === "number") body.priceCents = Math.round(patch.price * 100)
    if (typeof patch.categorySlug === "string") body.categorySlug = patch.categorySlug
    if (typeof patch.imageUrl === "string") body.imageUrl = patch.imageUrl
    if (typeof patch.description === "string") body.description = patch.description
    if (typeof patch.featured === "boolean") body.featured = patch.featured
    if (Array.isArray(patch.media)) body.media = patch.media
    if (typeof patch.kind === "string") body.kind = patch.kind
    if (typeof patch.shippingRequired === "boolean") body.shippingRequired = patch.shippingRequired
    if (typeof patch.weightKg === "number") body.weightGrams = Math.round(patch.weightKg * 1000)
    if (typeof patch.digitalVersion === "string") body.digitalVersion = patch.digitalVersion
    const res: Response = await fetch(`${API_BASE}/products/${encodeURIComponent(id)}`, {
      method: "PUT",
      headers: { "content-type": "application/json" },
      credentials: "include",
      body: JSON.stringify(body),
    })
    const dto: ServerProductDto = await asJson<ServerProductDto>(res)
    return mapServerToProduct(dto)
  },
  deleteById: async (id: string): Promise<boolean> => {
    const res: Response = await fetch(`${API_BASE}/products/${encodeURIComponent(id)}`, {
      method: "DELETE",
      credentials: "include",
    })
    const json: Readonly<{ ok?: boolean }> = await asJson<Readonly<{ ok?: boolean }>>(res)
    return json.ok === true
  },
} as const
