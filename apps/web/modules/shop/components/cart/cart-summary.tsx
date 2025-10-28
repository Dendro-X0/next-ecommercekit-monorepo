import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { useCartStore } from "@/lib/stores/cart"
import { AppLink } from "../../../shared/components/app-link"

export function CartSummary() {
  const { subtotal, shipping, tax, total, items } = useCartStore()

  if (items.length === 0) {
    return null
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Order Summary</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex justify-between">
          <span>Subtotal</span>
          <span>${subtotal.toFixed(2)}</span>
        </div>

        <div className="flex justify-between">
          <span>Shipping</span>
          <span>{shipping === 0 ? "Free" : `$${shipping.toFixed(2)}`}</span>
        </div>

        <div className="flex justify-between">
          <span>Tax</span>
          <span>${tax.toFixed(2)}</span>
        </div>

        <Separator />

        <div className="flex justify-between font-semibold text-lg">
          <span>Total</span>
          <span>${total.toFixed(2)}</span>
        </div>

        <Button asChild className="w-full" size="lg">
          <AppLink href="/checkout">Proceed to Checkout</AppLink>
        </Button>

        {shipping > 0 && (
          <p className="text-sm text-muted-foreground text-center">
            Free shipping on orders over $50
          </p>
        )}
      </CardContent>
    </Card>
  )
}
