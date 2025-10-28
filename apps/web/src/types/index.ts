/**
 * Product model. Supports both physical and digital goods.
 */
export interface Product {
  id: string
  name: string
  price: number
  originalPrice?: number
  description: string
  images: string[]
  category: string
  slug: string
  inStock: boolean
  rating: number
  reviewCount: number
  tags: string[]
  /** Optional kind; when omitted, UI may infer from tags. */
  kind?: "digital" | "physical"
  /** Optional digital metadata for downloads. */
  digital?: {
    readonly files?: ReadonlyArray<{ name: string; size?: string; type?: string; version?: string }>
    readonly version?: string
  }
}

export interface Category {
  id: string
  name: string
  slug: string
  image: string
  productCount: number
}

export interface Review {
  id: string
  productId: string
  userName: string
  rating: number
  comment: string
  date: string
}

export interface CartItem {
  product: Product
  quantity: number
}

export interface FilterOptions {
  categories: string[]
  priceRange: [number, number]
  inStock?: boolean
  /** Optional kind filter for product type. */
  kind?: "digital" | "physical"
}

export interface SortOption {
  value: string
  label: string
}
