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
    <div className="lg:hidden fixed inset-x-0 bottom-0 z-40 border-t border-border/40 bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60 shadow-[0_-8px_20px_rgba(0,0,0,0.1)] transition-all animate-in slide-in-from-bottom duration-300">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center gap-4">
          <div className="min-w-0 flex flex-col justify-center">
            <p className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground/80 leading-tight">Total Price</p>
            <p className="text-xl font-extrabold text-foreground leading-none mt-1">
              ${(Math.round(product.price * 100) / 100).toFixed(2)}
            </p>
          </div>
          <Button
            size="lg"
            className="flex-1 h-12 rounded-xl bg-primary text-primary-foreground font-bold shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
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
