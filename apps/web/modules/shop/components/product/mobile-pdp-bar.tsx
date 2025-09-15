"use client"

import type { JSX } from "react"
import { Button } from "@/components/ui/button"
import { useCartStore } from "@/lib/stores/cart"
import type { Product } from "@/types"

/**
 * MobilePdpBar
 * Sticky bottom bar on product detail pages for small screens.
 * Shows current price and a prominent Add to Cart action.
 */
interface MobilePdpBarProps {
  readonly product: Product
  readonly quantity: number
  readonly disabled?: boolean
}

export function MobilePdpBar({
  product,
  quantity,
  disabled = false,
}: MobilePdpBarProps): JSX.Element {
  const { addItem } = useCartStore()
  const handleAdd = (): void => {
    if (disabled) return
    addItem(product, quantity)
  }
  return (
    <div className="lg:hidden fixed inset-x-0 bottom-0 z-40 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-[0_-2px_10px_rgba(0,0,0,0.08)]">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground">Price</p>
            <p className="text-lg font-semibold">${product.price}</p>
          </div>
          <Button
            size="lg"
            className="flex-1"
            onClick={handleAdd}
            disabled={disabled}
            aria-label="Add to cart"
          >
            Add to Cart
          </Button>
        </div>
      </div>
    </div>
  )
}
