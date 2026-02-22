export type CatalogProvider = "native" | "shopify" | "medusa"

export type CatalogCapabilities = Readonly<{
  supportsWrite: boolean
  supportsCategoryProductCounts: boolean
}>

export type CatalogProduct = Readonly<{
  id: string
  slug: string
  name: string
  priceCents: number
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

export type CatalogCategory = Readonly<{
  id: string
  slug: string
  name: string
  image?: string
  productCount?: number
}>

export type ListProductsParams = Readonly<{
  query?: string
  category?: string
  sort: "newest" | "price_asc" | "price_desc"
  page: number
  pageSize: number
  featured?: boolean
}>

export type ListProductsResult = Readonly<{
  items: readonly CatalogProduct[]
  total: number
  page: number
  pageSize: number
}>

export type CreateProductInput = Readonly<{
  slug: string
  name: string
  priceCents: number
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
