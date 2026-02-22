import type { CatalogAdapter } from "../adapter"
import type {
  CatalogCategory,
  CatalogProduct,
  ListProductsParams,
  ListProductsResult,
} from "../types"

type ShopifyProductNode = Readonly<{
  id: string
  handle: string
  title: string
  description: string
  featuredImage?: { url: string } | null
  images?: { nodes?: readonly { url: string }[] } | null
  productType?: string | null
  tags?: readonly string[] | null
  variants?: {
    nodes?: readonly {
      price?: { amount: string; currencyCode: string } | null
      weight?: number | null
      weightUnit?: string | null
      requiresShipping?: boolean | null
    }[]
  } | null
}>

function assertEnv(name: string, v: string | undefined): string {
  if (!v || v.trim().length === 0) throw new Error(`${name} is required for Shopify catalog provider`)
  return v.trim()
}

async function shopifyFetch<T>(opts: Readonly<{ domain: string; token: string; query: string; variables?: unknown }>): Promise<T> {
  const res = await fetch(`https://${opts.domain}/api/${getShopifyApiVersion()}/graphql.json`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Storefront-Access-Token": opts.token,
    },
    body: JSON.stringify({ query: opts.query, variables: opts.variables ?? {} }),
  })
  const json = (await res.json()) as { data?: T; errors?: unknown }
  if (!res.ok || json.errors) {
    const msg = res.ok ? "Shopify GraphQL error" : `Shopify request failed (${res.status})`
    throw new Error(msg)
  }
  if (!json.data) throw new Error("Shopify response missing data")
  return json.data
}

function normalizeShopifyId(id: string): string {
  const m = /Product\/(\d+)/.exec(id)
  return m?.[1] ?? id
}

function getShopifyApiVersion(): string {
  const v = (process.env.SHOPIFY_API_VERSION ?? "").trim()
  return v.length > 0 ? v : "2024-04"
}

function toCatalogProduct(node: ShopifyProductNode): CatalogProduct {
  const images: readonly string[] = node.images?.nodes?.map((n) => n.url).filter(Boolean) ?? []
  const primary = node.featuredImage?.url || images[0]
  const variant = node.variants?.nodes?.[0]
  const amount = variant?.price?.amount
  const priceCents = amount ? Math.round(Number(amount) * 100) : 0
  const kind: "digital" | "physical" | undefined =
    node.productType?.toLowerCase() === "digital" ? "digital" : undefined
  const shippingRequired: boolean | undefined =
    typeof variant?.requiresShipping === "boolean" ? variant.requiresShipping : undefined
  const weightGrams: number | undefined =
    typeof variant?.weight === "number" && variant.weightUnit
      ? variant.weightUnit === "KILOGRAMS"
        ? Math.round(variant.weight * 1000)
        : variant.weightUnit === "GRAMS"
          ? Math.round(variant.weight)
          : undefined
      : undefined

  return {
    id: normalizeShopifyId(node.id),
    slug: node.handle,
    name: node.title,
    description: node.description || undefined,
    priceCents,
    currency: "USD",
    imageUrl: primary || undefined,
    featured: false,
    categorySlug: undefined,
    media: images.map((url) => ({ url, kind: "image" as const })),
    kind,
    shippingRequired,
    weightGrams,
    digitalVersion: undefined,
  }
}

export function createShopifyAdapter(): CatalogAdapter {
  const domain = assertEnv("SHOPIFY_STOREFRONT_DOMAIN", process.env.SHOPIFY_STOREFRONT_DOMAIN)
  const token = assertEnv("SHOPIFY_STOREFRONT_ACCESS_TOKEN", process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN)

  return {
    capabilities: {
      supportsWrite: false,
      supportsCategoryProductCounts: true,
    },

    listProducts: async (params: ListProductsParams): Promise<ListProductsResult> => {
      const queryParts: string[] = []
      if (params.query) queryParts.push(params.query)
      if (params.category) queryParts.push(`product_type:${params.category}`)
      if (params.featured) queryParts.push("tag:featured")
      const query = queryParts.join(" AND ")

      const gql = `query Products($first: Int!, $query: String) {
        products(first: $first, query: $query) {
          nodes {
            id
            handle
            title
            description
            featuredImage { url }
            images(first: 10) { nodes { url } }
            productType
            tags
            variants(first: 1) {
              nodes {
                price { amount currencyCode }
                weight
                weightUnit
                requiresShipping
              }
            }
          }
        }
      }`

      const data = await shopifyFetch<{
        products: { nodes: readonly ShopifyProductNode[] }
      }>({ domain, token, query: gql, variables: { first: Math.min(250, params.pageSize), query } })

      // Shopify Storefront API pagination is not used here; we approximate.
      const all = data.products.nodes.map(toCatalogProduct)
      const page = Math.max(1, params.page)
      const pageSize = Math.max(1, params.pageSize)
      const start = (page - 1) * pageSize
      const slice = all.slice(start, start + pageSize)
      return { items: slice, total: all.length, page, pageSize }
    },

    listFeaturedProducts: async (limit: number): Promise<readonly CatalogProduct[]> => {
      const res = await (async () => {
        const gql = `query Featured($first: Int!) {
          products(first: $first, query: "tag:featured") {
            nodes {
              id
              handle
              title
              description
              featuredImage { url }
              images(first: 10) { nodes { url } }
              productType
              tags
              variants(first: 1) {
                nodes {
                  price { amount currencyCode }
                  weight
                  weightUnit
                  requiresShipping
                }
              }
            }
          }
        }`
        return await shopifyFetch<{ products: { nodes: readonly ShopifyProductNode[] } }>({
          domain,
          token,
          query: gql,
          variables: { first: Math.min(250, Math.max(1, limit)) },
        })
      })()
      return res.products.nodes.map(toCatalogProduct)
    },

    getProductBySlug: async (slug: string): Promise<CatalogProduct | null> => {
      const gql = `query ByHandle($handle: String!) {
        productByHandle(handle: $handle) {
          id
          handle
          title
          description
          featuredImage { url }
          images(first: 20) { nodes { url } }
          productType
          tags
          variants(first: 1) {
            nodes {
              price { amount currencyCode }
              weight
              weightUnit
              requiresShipping
            }
          }
        }
      }`
      const data = await shopifyFetch<{ productByHandle: ShopifyProductNode | null }>({
        domain,
        token,
        query: gql,
        variables: { handle: slug },
      })
      return data.productByHandle ? toCatalogProduct(data.productByHandle) : null
    },

    getProductById: async (id: string): Promise<CatalogProduct | null> => {
      // Storefront API expects the global ID; we can't reliably reconstruct it.
      // This method is only required by admin edit flows; for external providers, the admin is read-only.
      // Return null to avoid misleading edits.
      return null
    },

    listCategories: async (): Promise<readonly CatalogCategory[]> => {
      const gql = `query Collections($first: Int!) {
        collections(first: $first) {
          nodes {
            id
            handle
            title
            image { url }
          }
        }
      }`
      const data = await shopifyFetch<{
        collections: { nodes: readonly { id: string; handle: string; title: string; image?: { url: string } | null }[] }
      }>({ domain, token, query: gql, variables: { first: 250 } })

      return data.collections.nodes.map((c) => ({
        id: c.id,
        slug: c.handle,
        name: c.title,
        image: c.image?.url ?? undefined,
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
