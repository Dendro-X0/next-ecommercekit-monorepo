/**
 * Cart API client.
 *
 * One export per file: `cartApi` exposes typed methods to interact with `/api/v1/cart`.
 */

/** Shared constants */
const API_BASE: string = "/api/v1"

/** Minimal server line-item shape */
export type CartApiItem = Readonly<{
  id: string
  productId: string
  variantId?: string
  name: string
  price: number // cents
  quantity: number
  imageUrl?: string
  currency: "USD"
}>

/** Minimal server cart shape */
export type CartApi = Readonly<{
  id: string
  items: readonly CartApiItem[]
  subtotal: number
  currency: "USD"
}>

/** Internal helper to handle JSON responses */
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

/**
 * Single export: cartApi.
 * Provides typed methods for cart operations.
 */
export const cartApi = {
  /** Get current cart (cookie-based). */
  get: async (): Promise<CartApi> => {
    const res: Response = await fetch(`${API_BASE}/cart`, { credentials: "include" })
    return asJson<CartApi>(res)
  },
  /** Add item to cart. Quantity must be positive. */
  addItem: async (
    args: Readonly<{
      id?: string
      productId: string
      name: string
      price: number
      quantity?: number
      imageUrl?: string
      variantId?: string
    }>,
  ): Promise<CartApi> => {
    const res: Response = await fetch(`${API_BASE}/cart/items`, {
      method: "POST",
      credentials: "include",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ ...args, quantity: args.quantity ?? 1 }),
    })
    return asJson<CartApi>(res)
  },
  /** Update line item quantity. Quantity must be positive. */
  updateItem: async (args: Readonly<{ id: string; quantity: number }>): Promise<CartApi> => {
    const res: Response = await fetch(`${API_BASE}/cart/items/${encodeURIComponent(args.id)}`, {
      method: "PATCH",
      credentials: "include",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ quantity: args.quantity }),
    })
    return asJson<CartApi>(res)
  },
  /** Remove line item by id. */
  removeItem: async (args: Readonly<{ id: string }>): Promise<CartApi> => {
    const res: Response = await fetch(`${API_BASE}/cart/items/${encodeURIComponent(args.id)}`, {
      method: "DELETE",
      credentials: "include",
    })
    return asJson<CartApi>(res)
  },
} as const
