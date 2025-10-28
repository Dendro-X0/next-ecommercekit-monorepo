"use client"

import { useQuery } from "@tanstack/react-query"
import { CheckCircle, Download, Truck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { ordersApi } from "@/lib/data/orders"
import { ORDER_BY_ID_QK } from "@/lib/orders/query-keys"
import type { Order } from "@/types/order"
import { AppLink } from "../../../../../modules/shared/components/app-link"

interface OrderSuccessPageProps {
  params: {
    orderId: string
  }
}

export default function OrderSuccessPage({ params }: OrderSuccessPageProps) {
  const { orderId } = params
  const { data, isLoading, error } = useQuery<Order>({
    queryKey: ORDER_BY_ID_QK(orderId),
    queryFn: () => ordersApi.byId(orderId),
    staleTime: 60_000,
  })

  if (isLoading) return <div className="container mx-auto px-4 py-16">Loading order...</div>
  if (error || !data) return <div className="container mx-auto px-4 py-16">Order not found.</div>

  return (
    <div className="container mx-auto px-4 py-16">
      <div className="max-w-2xl mx-auto text-center space-y-8">
        {/* Success Icon */}
        <div className="flex justify-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
            <CheckCircle className="w-12 h-12 text-green-600" />
          </div>
        </div>

        {/* Success Message */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-green-600">Order Confirmed!</h1>
          <p className="text-muted-foreground">
            Thank you for your purchase. Your order has been successfully placed.
          </p>
        </div>

        {/* Order Details Card */}
        <Card>
          <CardHeader>
            <CardTitle>Order Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Order Number:</span>
                <p className="font-medium">{data.id}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Total:</span>
                <p className="font-medium">${data.total.toFixed(2)}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Email:</span>
                <p className="font-medium">{data.email ?? "-"}</p>
              </div>
              <div />
            </div>

            <Separator />
            <div className="text-sm space-y-2">
              <span className="text-muted-foreground">Items:</span>
              <ul className="list-disc pl-5">
                {data.items.map((it) => (
                  <li key={it.id} className="flex justify-between">
                    <span>
                      {it.name} × {it.quantity}
                    </span>
                    <span>${(it.price * it.quantity).toFixed(2)}</span>
                  </li>
                ))}
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button variant="outline" className="flex items-center gap-2 bg-transparent">
            <Download className="w-4 h-4" />
            Download Receipt
          </Button>
          <Button variant="outline" className="flex items-center gap-2 bg-transparent">
            <Truck className="w-4 h-4" />
            Track Order
          </Button>
          <Button asChild>
            <AppLink href="/shop">Continue Shopping</AppLink>
          </Button>
        </div>

        {/* Additional Info */}
        <div className="text-sm text-muted-foreground space-y-2">
          {data.email ? <p>A confirmation email has been sent to {data.email}</p> : null}
          <p>
            You can track your order status in your{" "}
            <AppLink href="/account" className="text-primary hover:underline">
              account dashboard
            </AppLink>
          </p>
        </div>
      </div>
    </div>
  )
}
