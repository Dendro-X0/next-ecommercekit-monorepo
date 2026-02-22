import { categoriesRepo, productsRepo } from "@repo/db"
import type { CatalogAdapter } from "../adapter"
import type {
  CatalogCategory,
  CatalogProduct,
  CreateProductInput,
  ListProductsParams,
  ListProductsResult,
  UpdateProductInput,
} from "../types"

function toCatalogProduct(p: {
  readonly id: string
  readonly slug: string
  readonly name: string
  readonly price: number | undefined
  readonly priceCents?: number
  readonly priceCentsLegacy?: number
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
}): CatalogProduct {
  const priceCents =
    typeof p.priceCents === "number"
      ? p.priceCents
      : typeof p.price === "number"
        ? p.price
        : typeof p.priceCentsLegacy === "number"
          ? p.priceCentsLegacy
          : 0
  return {
    id: p.id,
    slug: p.slug,
    name: p.name,
    priceCents,
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

export function createNativeAdapter(): CatalogAdapter {
  return {
    capabilities: {
      supportsWrite: true,
      supportsCategoryProductCounts: true,
    },

    listProducts: async (params: ListProductsParams): Promise<ListProductsResult> => {
      const res = await productsRepo.list({
        query: params.query,
        category: params.category,
        sort: params.sort,
        page: params.page,
        pageSize: params.pageSize,
        featured: params.featured,
      })
      return {
        items: res.items.map((p) => toCatalogProduct(p as unknown as Parameters<typeof toCatalogProduct>[0])),
        total: res.total,
        page: res.page,
        pageSize: res.pageSize,
      }
    },

    listFeaturedProducts: async (limit: number): Promise<readonly CatalogProduct[]> => {
      const items = await productsRepo.listFeatured(limit)
      return items.map((p) => toCatalogProduct(p as unknown as Parameters<typeof toCatalogProduct>[0]))
    },

    getProductBySlug: async (slug: string): Promise<CatalogProduct | null> => {
      const p = await productsRepo.bySlug(slug)
      return p ? toCatalogProduct(p as unknown as Parameters<typeof toCatalogProduct>[0]) : null
    },

    getProductById: async (id: string): Promise<CatalogProduct | null> => {
      const p = await productsRepo.byId(id)
      return p ? toCatalogProduct(p as unknown as Parameters<typeof toCatalogProduct>[0]) : null
    },

    listCategories: async (): Promise<readonly CatalogCategory[]> => {
      const items = await categoriesRepo.list()
      return items.map(
        (c) =>
          ({
            id: c.id,
            slug: c.slug,
            name: c.name,
            image: c.imageUrl,
            productCount: c.productCount,
          }) satisfies CatalogCategory,
      )
    },

    createProduct: async (input: CreateProductInput): Promise<CatalogProduct> => {
      const created = await productsRepo.create({
        slug: input.slug,
        name: input.name,
        priceCents: input.priceCents,
        currency: input.currency,
        imageUrl: input.imageUrl,
        description: input.description,
        categorySlug: input.categorySlug,
        featured: input.featured,
        media: input.media,
        kind: input.kind,
        shippingRequired: input.shippingRequired,
        weightGrams: input.weightGrams,
        digitalVersion: input.digitalVersion,
      })
      return toCatalogProduct(created as unknown as Parameters<typeof toCatalogProduct>[0])
    },

    updateProduct: async (id: string, input: UpdateProductInput): Promise<CatalogProduct | null> => {
      const updated = await productsRepo.update(id, {
        slug: input.slug,
        name: input.name,
        priceCents: input.priceCents,
        currency: input.currency,
        imageUrl: input.imageUrl,
        description: input.description,
        categorySlug: input.categorySlug,
        featured: input.featured,
        media: input.media,
        kind: input.kind,
        shippingRequired: input.shippingRequired,
        weightGrams: input.weightGrams,
        digitalVersion: input.digitalVersion,
      })
      return updated ? toCatalogProduct(updated as unknown as Parameters<typeof toCatalogProduct>[0]) : null
    },

    deleteProduct: async (id: string): Promise<boolean> => {
      const ok = await productsRepo.remove(id)
      return Boolean(ok)
    },
  } as const
}
