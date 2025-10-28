"use client"

import { useQuery } from "@tanstack/react-query"
import { useParams } from "next/navigation"
import type { JSX } from "react"
import { DashboardHeader } from "@/app/dashboard/user/_components/dashboard-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { SidebarInset } from "@/components/ui/sidebar"
import { ordersApi } from "@/lib/data/orders"
import { ORDER_BY_ID_QK } from "@/lib/orders/query-keys"
import type { Order } from "@/types/order"
import { AppLink } from "../../../../../../modules/shared/components/app-link"

export default function UserOrderDetailPage(): JSX.Element {
  const { orderId } = useParams<{ orderId: string }>()
  const { data } = useQuery<Order>({
    queryKey: ORDER_BY_ID_QK(orderId),
    queryFn: () => ordersApi.byId(orderId),
  })
  const order = data
  const breadcrumbs = [
    { label: "Dashboard", href: "/dashboard/user" },
    { label: "Orders", href: "/dashboard/user/orders" },
    { label: orderId },
  ]

  function formatProvider(p?: Order["paymentProvider"]): string {
    if (!p) return "-"
    return p.charAt(0).toUpperCase() + p.slice(1)
  }

  return (
    <SidebarInset>
      <DashboardHeader title="Order Details" breadcrumbs={breadcrumbs} />
      <div className="flex-1 space-y-6 p-6">
        {!order ? (
          <Card>
            <CardHeader>
              <CardTitle>Order not found</CardTitle>
            </CardHeader>
            <CardContent>
              <AppLink href="/dashboard/user/orders" className="text-primary hover:underline">
                Back to Orders
              </AppLink>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Order #{order.id}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Date:</span>
                  <p className="font-medium">{new Date(order.createdAt).toLocaleString()}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Total:</span>
                  <p className="font-medium">${order.total.toFixed(2)}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Email:</span>
                  <p className="font-medium">{order.email ?? "-"}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Payment:</span>
                  <p className="font-medium">{formatProvider(order.paymentProvider)}</p>
                </div>
                <div className="col-span-2">
                  <span className="text-muted-foreground">Payment Ref:</span>
                  <p className="font-medium font-mono text-xs break-all">
                    {order.paymentRef ?? "-"}
                  </p>
                </div>
              </div>

              <Separator />

              <div className="text-sm space-y-2">
                <span className="text-muted-foreground">Items:</span>
                <ul className="list-disc pl-5">
                  {order.items.map((it) => (
                    <li key={it.id} className="flex justify-between">
                      <span>
                        {it.name} × {it.quantity}
                      </span>
                      <span>${(it.price * it.quantity).toFixed(2)}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <Separator />

              <div className="text-sm space-y-1">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>${order.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Shipping</span>
                  <span>${order.shipping.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tax</span>
                  <span>${order.tax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-medium">
                  <span>Total</span>
                  <span>${order.total.toFixed(2)}</span>
                </div>
              </div>

              <div className="pt-4">
                <AppLink href="/dashboard/user/orders" className="text-primary hover:underline">
                  Back to Orders
                </AppLink>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </SidebarInset>
  )
}
