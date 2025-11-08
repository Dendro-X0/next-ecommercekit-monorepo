import { useQuery, useQueryClient } from "@tanstack/react-query"
import * as React from "react"
import { wishlistApi } from "@/lib/data/wishlist"
import { WISHLIST_HAS_QK } from "@/lib/wishlist/query-keys"
import type { Product } from "@/types"
import { ProductCard } from "./product-card"
import { uiTemplates } from "@/lib/safe-mode"

interface ProductGridProps {
  products: Product[]
  /** When true, mark the first above-the-fold product image as high priority for LCP. */
  priorityFirst?: boolean
}

export function ProductGrid({ products, priorityFirst = false }: ProductGridProps) {
  const queryClient = useQueryClient()
  const enableWishlist: boolean =
    (process.env.NEXT_PUBLIC_UI_ENABLE_WISHLIST ?? "false").toLowerCase() === "true"
  const wishlistDisabled: boolean = uiTemplates && !enableWishlist

  // Prime cache with a single bulk call; components will read from cache
  const productIds = React.useMemo<string[]>(
    () => products.map((p) => p.id).filter(Boolean),
    [products],
  )
  // Build a stable, order-insensitive key to avoid re-fetch loops when product order changes
  const idsKey = React.useMemo<string>(() => {
    if (productIds.length === 0) return ""
    const uniq = Array.from(new Set(productIds))
    uniq.sort() // order-insensitive
    return uniq.join(",")
  }, [productIds])
  const {
    data: wlMap = {},
    isPending: bulkPending,
    isFetching: bulkFetching,
  } = useQuery<Readonly<Record<string, boolean>>>({
    queryKey: ["wishlist", "has", "bulk", idsKey],
    queryFn: () => wishlistApi.hasBulk(productIds),
    enabled: !wishlistDisabled && idsKey.length > 0,
    staleTime: 60_000,
    retry: 0,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    select: (map) => {
      // warm per-id caches so ProductCard can read instantly
      for (const id of Object.keys(map)) {
        queryClient.setQueryData<boolean>(WISHLIST_HAS_QK(id), map[id])
      }
      return map
    },
  })
  const bulkReady = !bulkPending && !bulkFetching
  if (products.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No products found.</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
      {products.map((product, idx) => (
        <ProductCard
          key={product.id}
          product={product}
          initialWishlist={wlMap[product.id]}
          bulkReady={bulkReady}
          priority={priorityFirst && idx === 0}
        />
      ))}
    </div>
  )
}
