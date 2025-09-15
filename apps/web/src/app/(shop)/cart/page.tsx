"use client"

import { ShoppingBag } from "lucide-react"
import { CartItem } from "@/components/cart/cart-item"
import { CartSummary } from "@/components/cart/cart-summary"
import { MobileCheckoutBar } from "@/components/cart/mobile-checkout-bar"
import { Button } from "@/components/ui/button"
import { useCartStore } from "@/lib/stores/cart"
import { AppLink } from "../../../../modules/shared/components/app-link"

export default function CartPage() {
  const { items } = useCartStore()

  if (items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="text-center space-y-6">
          <ShoppingBag className="h-24 w-24 mx-auto text-muted-foreground" />
          <div>
            <h1 className="text-2xl font-bold mb-2">Your cart is empty</h1>
            <p className="text-muted-foreground">
              Looks like you haven&apos;t added anything to your cart yet.
            </p>
          </div>
          <Button asChild size="lg">
            <AppLink href="/shop">Continue Shopping</AppLink>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 pt-8 pb-28 lg:pb-8">
      <h1 className="text-3xl font-bold mb-8">Shopping Cart</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Cart Items */}
        <div className="lg:col-span-2">
          <div className="bg-card rounded-lg border p-4 sm:p-6">
            <h2 className="text-xl font-semibold mb-6">Cart Items ({items.length})</h2>

            <div className="space-y-0">
              {items.map((item) => (
                <CartItem key={item.id} item={item} />
              ))}
            </div>
          </div>

          <div className="mt-6">
            <Button variant="outline" asChild className="w-full sm:w-auto">
              <AppLink href="/shop">Continue Shopping</AppLink>
            </Button>
          </div>
        </div>

        {/* Cart Summary */}
        <div className="mt-8 lg:mt-0 lg:sticky lg:top-24">
          <CartSummary />
        </div>
      </div>
      <MobileCheckoutBar />
    </div>
  )
}
