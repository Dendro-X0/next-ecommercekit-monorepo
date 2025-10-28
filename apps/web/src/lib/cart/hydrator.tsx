"use client"

import { useQuery } from "@tanstack/react-query"
import { useEffect } from "react"
import { CART_QK } from "@/lib/cart/query-keys"
import { type CartApi, type CartApiItem, cartApi } from "@/lib/data/cart"
import { productsApi } from "@/lib/data/products"
import { useCartStore } from "@/lib/stores/cart"
import type { Product } from "@/types"
import type { CartItem } from "@/types/cart"

/**
 * Hydrates the client cart store from the server cart using TanStack Query.
 * Runs in the Shop layout so all shop pages stay in sync across refresh/login.
 */
export function CartHydrator(): null {
  const currentItems = useCartStore((s) => s.items)
  const hydrate = useCartStore((s) => s.hydrate)

  const { data } = useQuery<CartApi>({
    queryKey: CART_QK,
    queryFn: cartApi.get,
    staleTime: 5 * 60_000,
    retry: 1,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    placeholderData: (prev) => prev as CartApi | undefined,
  })

  useEffect(() => {
    if (!data) return
    let cancelled = false
    ;(async () => {
      const nextItems: CartItem[] = await mapServerItemsToClient(data.items, currentItems)
      if (!cancelled) hydrate(nextItems)
    })()
    return () => {
      cancelled = true
    }
    // hydrate whenever the server cart id or item list reference changes
  }, [data, hydrate, currentItems])

  return null
}

async function mapServerItemsToClient(
  serverItems: readonly CartApiItem[],
  existing: readonly CartItem[],
): Promise<CartItem[]> {
  const results: CartItem[] = []
  // quick index by productId for existing items
  const byProductId = new Map<string, CartItem>()
  for (const it of existing) byProductId.set(it.product.id, it)

  await Promise.all(
    serverItems.map(async (srv) => {
      const found: CartItem | undefined =
        existing.find((x) => x.id === srv.id) ?? byProductId.get(srv.productId)
      if (found) {
        results.push({ ...found, quantity: srv.quantity })
        return
      }
      let product: Product | undefined
      try {
        product = await productsApi.byId(srv.productId)
      } catch {
        product = undefined
      }
      const fallback: Product = product ?? {
        id: srv.productId,
        name: srv.name,
        price: Math.round(srv.price) / 100,
        description: "",
        images: srv.imageUrl ? [srv.imageUrl] : ["/placeholder.svg"],
        category: "General",
        slug: srv.productId,
        inStock: true,
        rating: 4.5,
        reviewCount: 0,
        tags: [],
      }
      results.push({ id: srv.id, product: fallback, quantity: srv.quantity })
    }),
  )

  return results
}
