"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Heart, ShoppingCart } from "lucide-react"
import * as React from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { SafeImage } from "@/components/ui/safe-image"
import { StarRating } from "@/components/ui/star-rating"
import { isDigitalProduct } from "@/lib/cart/utils"
import { wishlistApi } from "@/lib/data/wishlist"
import { productsDisabled, uiTemplates } from "@/lib/safe-mode"
import { useCartStore } from "@/lib/stores/cart"
import { WISHLIST_HAS_QK, WISHLIST_QK } from "@/lib/wishlist/query-keys"
import type { Product } from "@/types"
import { AppLink } from "../../../shared/components/app-link"

interface ProductCardProps {
  product: Product
  initialWishlist?: boolean
  bulkReady?: boolean
  /** If true, treats this card's image as LCP candidate. */
  priority?: boolean
}

export function ProductCard({
  product,
  initialWishlist,
  bulkReady = true,
  priority = false,
}: ProductCardProps) {
  const { addItem } = useCartStore()
  const safePrice: number = Number.isFinite(product.price) ? product.price : 0
  const safeOriginal: number | undefined =
    Number.isFinite(product.originalPrice) && (product.originalPrice as number) > 0
      ? (product.originalPrice as number)
      : undefined
  const hasDiscount: boolean =
    typeof safeOriginal === "number" && safeOriginal > 0 && safeOriginal > safePrice
  const kindLabel = isDigitalProduct(product) ? "Download" : "Shipping"
  const queryClient = useQueryClient()
  const productId: string = product.id
  const discountPercent: number =
    typeof safeOriginal === "number" && safeOriginal > 0
      ? Math.round(((safeOriginal - safePrice) / safeOriginal) * 100)
      : 0

  // In UI template mode (or when products are disabled) we must not fire wishlist queries
  const RAW_WL = process.env.NEXT_PUBLIC_UI_ENABLE_WISHLIST
  const enableWishlist: boolean = (RAW_WL ?? "false").toLowerCase() === "true"
  const disableWishlist: boolean = (uiTemplates && !enableWishlist) || productsDisabled

  // Only run wishlist queries when the card is actually visible to the user
  const cardRef = React.useRef<HTMLDivElement | null>(null)
  const [visible, setVisible] = React.useState<boolean>(false)
  React.useEffect(() => {
    if (typeof window === "undefined") return
    const el = cardRef.current
    if (!el) return
    const io = new IntersectionObserver(
      (entries) => {
        const entry = entries[0]
        if (entry) setVisible(entry.isIntersecting)
      },
      { rootMargin: "200px" },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])

  const { data: isWishlisted = false, isLoading: wlLoading } = useQuery<boolean>({
    queryKey: WISHLIST_HAS_QK(productId),
    queryFn: () => wishlistApi.has(productId),
    enabled: (() => {
      if (disableWishlist || !productId || !visible || !bulkReady) return false
      const cached = queryClient.getQueryData<boolean>(WISHLIST_HAS_QK(productId))
      return cached === undefined
    })(),
    initialData: typeof initialWishlist === "boolean" ? initialWishlist : undefined,
    staleTime: 60_000,
    refetchOnMount: false,
  })

  const toggleWishlist = useMutation<boolean, Error, void, { prev?: boolean }>({
    mutationFn: () => wishlistApi.toggle(productId),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: WISHLIST_HAS_QK(productId) })
      const prev = queryClient.getQueryData<boolean>(WISHLIST_HAS_QK(productId))
      queryClient.setQueryData<boolean>(WISHLIST_HAS_QK(productId), !(prev ?? false))
      return { prev }
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev !== undefined) queryClient.setQueryData(WISHLIST_HAS_QK(productId), ctx.prev)
    },
    onSettled: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: WISHLIST_QK }),
        queryClient.invalidateQueries({ queryKey: WISHLIST_HAS_QK(productId) }),
      ])
    },
  })

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    addItem(product)
  }

  return (
    <div
      ref={cardRef}
      className="group relative bg-card rounded-lg border p-4 transition-all hover:shadow-lg"
      data-testid="product-card"
    >
      {/* Product Image */}
      <div className="relative aspect-square overflow-hidden rounded-md bg-muted">
        <SafeImage
          src={product.images?.[0] || "/placeholder.svg"}
          alt={product.name || "Product"}
          fill
          className="object-cover transition-all group-hover:scale-105"
          sizes="(min-width: 1280px) 25vw, (min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
          priority={priority}
          fetchPriority={priority ? "high" : "low"}
        />

        {/* Badges */}
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          <Badge variant={isDigitalProduct(product) ? "default" : "secondary"}>{kindLabel}</Badge>
          {!product.inStock && <Badge variant="secondary">Out of Stock</Badge>}
          {hasDiscount && <Badge variant="destructive">{discountPercent}% OFF</Badge>}
        </div>

        {/* Quick Actions (disabled in UI-only mode) */}
        {!disableWishlist && (
          <div
            className="absolute top-2 right-2 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
            data-testid="plp-wishlist-toggle"
            data-ready={wlLoading ? "false" : "true"}
          >
            <Button
              size="icon"
              variant="secondary"
              className="h-8 w-8"
              onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                e.preventDefault()
                e.stopPropagation()
                toggleWishlist.mutate()
              }}
              disabled={toggleWishlist.isPending || wlLoading}
              aria-pressed={isWishlisted}
              aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
              data-testid="plp-wishlist-toggle-button"
            >
              <Heart className={`h-4 w-4 ${isWishlisted ? "text-red-500 fill-current" : ""}`} />
            </Button>
          </div>
        )}

        {/* Add to Cart Overlay */}
        <div className="absolute inset-x-0 bottom-0 p-2 bg-linear-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            size="sm"
            className="w-full"
            disabled={!product.inStock}
            onClick={handleAddToCart}
          >
            <ShoppingCart className="h-4 w-4 mr-2" />
            Add to Cart
          </Button>
        </div>
      </div>

      {/* Product Info */}
      <div className="mt-4 space-y-2">
        <div className="flex items-center justify-between">
          <Badge variant="outline" className="text-xs">
            {product.category ??
              (product as unknown as { categorySlug?: string }).categorySlug ??
              "Product"}
          </Badge>
          <StarRating rating={Number.isFinite(product.rating) ? product.rating : 0} size="sm" />
        </div>

        <AppLink href={product.slug ? `/products/${product.slug}` : "#"}>
          <h2 className="font-medium line-clamp-2 hover:text-primary transition-colors">
            {product.name || "Untitled Product"}
          </h2>
        </AppLink>

        <p className="text-sm text-muted-foreground line-clamp-2">{product.description}</p>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-bold text-lg">${safePrice}</span>
            {hasDiscount && (
              <span className="text-sm text-muted-foreground line-through">${safeOriginal}</span>
            )}
          </div>
          <span className="text-xs text-muted-foreground">
            ({Number.isFinite(product.reviewCount) ? product.reviewCount : 0} reviews)
          </span>
        </div>

        {/* Mobile Add to Cart */}
        <div className="sm:hidden">
          <Button
            size="sm"
            className="w-full"
            disabled={!product.inStock}
            onClick={handleAddToCart}
          >
            <ShoppingCart className="h-4 w-4 mr-2" />
            Add to Cart
          </Button>
        </div>
      </div>
    </div>
  )
}
