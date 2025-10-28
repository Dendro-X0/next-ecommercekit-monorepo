import Image from "next/image"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { isDigitalOnlyCart } from "@/lib/cart/utils"
import { useCartStore } from "@/lib/stores/cart"
import type { PaymentMethod, ShippingAddress } from "@/types/cart"

/**
 * Compact, resilient order summary used in checkout sidebar and review step.
 */
type Totals = Readonly<{ subtotal: number; shipping: number; tax: number; total: number }>

interface OrderSummaryProps {
  shippingAddress?: ShippingAddress | null
  paymentMethod?: PaymentMethod | null
  totalsOverride?: Totals
}

export function OrderSummary({
  shippingAddress,
  paymentMethod,
  totalsOverride,
}: OrderSummaryProps) {
  const { items, subtotal, shipping, tax, total } = useCartStore()
  const digitalOnly: boolean = isDigitalOnlyCart(items)
  const addr = shippingAddress
  const pm = paymentMethod
  const totals: Totals = totalsOverride ?? { subtotal, shipping, tax, total }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Order Summary</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Items */}
        <div>
          <h3 className="font-medium mb-4">Items ({items.length})</h3>
          <div className="space-y-3">
            {items.map((item) => (
              <div key={item.id} className="flex gap-3">
                <div className="relative h-16 w-16 overflow-hidden rounded-md bg-muted">
                  <Image
                    src={item.product.images[0] || "/placeholder.svg"}
                    alt={item.product.name}
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="flex-1">
                  <h4 className="font-medium text-sm">{item.product.name}</h4>
                  <p className="text-sm text-muted-foreground">Qty: {item.quantity}</p>
                </div>
                <div className="text-sm font-medium">
                  ${(item.product.price * item.quantity).toFixed(2)}
                </div>
              </div>
            ))}
          </div>
        </div>

        <Separator />

        {/* Shipping Address or Digital Delivery */}
        {!digitalOnly ? (
          <div>
            <h3 className="font-medium mb-2">Shipping Address</h3>
            {addr ? (
              <div className="text-sm text-muted-foreground">
                <p>
                  {addr.firstName} {addr.lastName}
                </p>
                <p>{addr.address}</p>
                <p>
                  {addr.city}, {addr.state} {addr.zipCode}
                </p>
                <p>{addr.country}</p>
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">
                Add your shipping details in the previous step.
              </div>
            )}
          </div>
        ) : (
          <div>
            <h3 className="font-medium mb-2">Delivery</h3>
            <p className="text-sm text-muted-foreground">
              Digital download via email and your Library after purchase.
            </p>
          </div>
        )}

        <Separator />

        {/* Payment Method */}
        <div>
          <h3 className="font-medium mb-2">Payment Method</h3>
          <p className="text-sm text-muted-foreground">
            {pm ? pm.name : "Select a payment method in the next step."}
          </p>
        </div>

        <Separator />

        {/* Totals */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Subtotal</span>
            <span>${totals.subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Shipping</span>
            <span>{totals.shipping === 0 ? "Free" : `$${totals.shipping.toFixed(2)}`}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Tax</span>
            <span>${totals.tax.toFixed(2)}</span>
          </div>
          <Separator />
          <div className="flex justify-between font-semibold">
            <span>Total</span>
            <span>${totals.total.toFixed(2)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
