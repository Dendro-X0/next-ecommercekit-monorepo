import type {
  CatalogCapabilities,
  CatalogCategory,
  CatalogProduct,
  CreateProductInput,
  ListProductsParams,
  ListProductsResult,
  UpdateProductInput,
} from "./types"

export type CatalogAdapter = Readonly<{
  readonly capabilities: CatalogCapabilities

  // Reads
  listProducts(params: ListProductsParams): Promise<ListProductsResult>
  listFeaturedProducts(limit: number): Promise<readonly CatalogProduct[]>
  getProductBySlug(slug: string): Promise<CatalogProduct | null>
  getProductById(id: string): Promise<CatalogProduct | null>
  listCategories(): Promise<readonly CatalogCategory[]>

  // Writes
  createProduct(input: CreateProductInput): Promise<CatalogProduct>
  updateProduct(id: string, input: UpdateProductInput): Promise<CatalogProduct | null>
  deleteProduct(id: string): Promise<boolean>
}>
