"use client"

import type { JSX } from "react"
import { Button } from "@/components/ui/button"
import { useCartStore } from "@/lib/stores/cart"
import { AppLink } from "../../../shared/components/app-link"

/**
 * MobileCheckoutBar
 * Sticky bottom bar shown on small screens to surface the checkout CTA and order total.
 * Renders nothing when the cart is empty or on large screens (hidden via responsive classes).
 */
export function MobileCheckoutBar(): JSX.Element | null {
  const { total, items } = useCartStore()
  if (items.length === 0) {
    return null
  }

  return (
    <div className="lg:hidden fixed inset-x-0 bottom-0 z-40 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-[0_-2px_10px_rgba(0,0,0,0.08)]">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground">Total</p>
            <p className="text-lg font-semibold">${total.toFixed(2)}</p>
          </div>
          <Button asChild size="lg" className="flex-1">
            <AppLink href="/checkout" aria-label="Proceed to checkout">
              Proceed to Checkout
            </AppLink>
          </Button>
        </div>
      </div>
    </div>
  )
}
