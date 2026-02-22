import type { CatalogAdapter } from "../adapter"
import type {
  CatalogCategory,
  CatalogProduct,
  ListProductsParams,
  ListProductsResult,
} from "../types"

function assertEnv(name: string, v: string | undefined): string {
  if (!v || v.trim().length === 0) throw new Error(`${name} is required for Medusa catalog provider`)
  return v.trim()
}

function ensureNoTrailingSlash(u: string): string {
  return u.endsWith("/") ? u.slice(0, -1) : u
}

type MedusaProduct = Readonly<{
  id: string
  handle?: string | null
  title: string
  description?: string | null
  thumbnail?: string | null
  images?: readonly { url: string }[]
  categories?: readonly { handle?: string | null }[]
  tags?: readonly { value: string }[]
  variants?: readonly {
    prices?: readonly { amount: number; currency_code: string }[]
    inventory_quantity?: number
    weight?: number | null
  }[]
}>

type MedusaCategory = Readonly<{
  id: string
  handle: string
  name: string
}>

async function medusaFetch<T>(opts: Readonly<{ baseUrl: string; path: string; apiKey: string }>): Promise<T> {
  const res = await fetch(`${opts.baseUrl}${opts.path}`, {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${opts.apiKey}`,
    },
  })
  if (!res.ok) throw new Error(`Medusa request failed (${res.status})`)
  return (await res.json()) as T
}

function toCatalogProduct(p: MedusaProduct): CatalogProduct {
  const slug = (p.handle && p.handle.trim().length > 0 ? p.handle : p.id).toString()
  const firstPrice = p.variants?.[0]?.prices?.find((x) => x.currency_code?.toLowerCase() === "usd")
  const priceCents = typeof firstPrice?.amount === "number" ? firstPrice.amount : 0
  const categorySlug = p.categories?.[0]?.handle ?? undefined
  const images = p.images?.map((i) => i.url).filter(Boolean) ?? []
  const primary = (p.thumbnail && p.thumbnail.trim().length > 0 ? p.thumbnail : images[0]) || undefined

  return {
    id: p.id,
    slug,
    name: p.title,
    description: p.description ?? undefined,
    priceCents,
    currency: "USD",
    imageUrl: primary,
    featured: false,
    categorySlug,
    media: images.map((url) => ({ url, kind: "image" as const })),
    kind: undefined,
    shippingRequired: undefined,
    weightGrams: typeof p.variants?.[0]?.weight === "number" ? Math.round(p.variants[0].weight) : undefined,
    digitalVersion: undefined,
  }
}

export function createMedusaAdapter(): CatalogAdapter {
  const baseUrl = ensureNoTrailingSlash(assertEnv("MEDUSA_BACKEND_URL", process.env.MEDUSA_BACKEND_URL))
  const apiKey = assertEnv("MEDUSA_ADMIN_API_KEY", process.env.MEDUSA_ADMIN_API_KEY)

  return {
    capabilities: {
      supportsWrite: false,
      supportsCategoryProductCounts: false,
    },

    listProducts: async (params: ListProductsParams): Promise<ListProductsResult> => {
      const limit = Math.min(200, Math.max(1, params.pageSize))
      const offset = Math.max(0, (Math.max(1, params.page) - 1) * limit)
      const q = params.query ? `&q=${encodeURIComponent(params.query)}` : ""
      const data = await medusaFetch<{ products: readonly MedusaProduct[]; count?: number }>({
        baseUrl,
        apiKey,
        path: `/admin/products?limit=${limit}&offset=${offset}${q}`,
      })
      const items = data.products.map(toCatalogProduct)
      return {
        items,
        total: typeof data.count === "number" ? data.count : items.length,
        page: Math.max(1, params.page),
        pageSize: limit,
      }
    },

    listFeaturedProducts: async (limit: number): Promise<readonly CatalogProduct[]> => {
      const data = await medusaFetch<{ products: readonly MedusaProduct[] }>({
        baseUrl,
        apiKey,
        path: `/admin/products?limit=${Math.min(50, Math.max(1, limit))}&offset=0`,
      })
      return data.products.map(toCatalogProduct)
    },

    getProductBySlug: async (slug: string): Promise<CatalogProduct | null> => {
      const data = await medusaFetch<{ products: readonly MedusaProduct[] }>({
        baseUrl,
        apiKey,
        path: `/admin/products?q=${encodeURIComponent(slug)}&limit=50&offset=0`,
      })
      const match = data.products.find((p) => p.handle === slug || p.id === slug)
      return match ? toCatalogProduct(match) : null
    },

    getProductById: async (id: string): Promise<CatalogProduct | null> => {
      const data = await medusaFetch<{ product: MedusaProduct }>({
        baseUrl,
        apiKey,
        path: `/admin/products/${encodeURIComponent(id)}`,
      })
      return data.product ? toCatalogProduct(data.product) : null
    },

    listCategories: async (): Promise<readonly CatalogCategory[]> => {
      const data = await medusaFetch<{ product_categories: readonly MedusaCategory[] }>({
        baseUrl,
        apiKey,
        path: `/admin/product-categories?limit=200&offset=0`,
      })
      return data.product_categories.map((c) => ({
        id: c.id,
        slug: c.handle,
        name: c.name,
        image: undefined,
        productCount: undefined,
      }))
    },

    createProduct: async () => {
      throw new Error("Catalog provider is read-only")
    },
    updateProduct: async () => {
      throw new Error("Catalog provider is read-only")
    },
    deleteProduct: async () => {
      throw new Error("Catalog provider is read-only")
    },
  } as const
}
