"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useParams } from "next/navigation"
import { type JSX, useId } from "react"
import { DashboardHeader } from "@/app/dashboard/user/_components/dashboard-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { SidebarInset } from "@/components/ui/sidebar"
import { ADMIN_ORDER_BY_ID_QK, ADMIN_ORDERS_QK } from "@/lib/admin/orders/query-keys"
import { type AdminOrder, adminApi } from "@/lib/data/admin-api"
import { AppLink } from "../../../../../../modules/shared/components/app-link"

export default function AdminOrderDetailPage(): JSX.Element {
  const { orderId } = useParams<{ orderId: string }>()
  const statusId = useId()
  const qc = useQueryClient()
  const { data } = useQuery<AdminOrder>({
    queryKey: ADMIN_ORDER_BY_ID_QK(orderId),
    queryFn: () => adminApi.getOrder(orderId),
  })
  const order = data

  const mutation = useMutation({
    mutationFn: (status: AdminOrder["status"]) => adminApi.updateOrderStatus(orderId, status),
    onSuccess: async () => {
      await Promise.all([
        qc.invalidateQueries({ queryKey: ADMIN_ORDER_BY_ID_QK(orderId) }),
        qc.invalidateQueries({ queryKey: ADMIN_ORDERS_QK }),
      ])
    },
  })

  function formatUsdFromCents(cents: number): string {
    const dollars = Math.round(cents) / 100
    return dollars.toLocaleString(undefined, { style: "currency", currency: "USD" })
  }

  const breadcrumbs = [
    { label: "Dashboard", href: "/dashboard/admin" },
    { label: "Orders", href: "/dashboard/admin/orders" },
    { label: orderId },
  ]

  function formatProvider(p?: AdminOrder["paymentProvider"]): string {
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
              <AppLink href="/dashboard/admin/orders" className="text-primary hover:underline">
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
                  <p className="font-medium">{formatUsdFromCents(order.totalCents)}</p>
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
                <div className="space-y-2">
                  <Label htmlFor={statusId}>Status</Label>
                  <Select
                    value={order.status}
                    onValueChange={(v) => mutation.mutate(v as AdminOrder["status"])}
                    disabled={mutation.isPending}
                  >
                    <SelectTrigger id={statusId} className="w-[200px] capitalize">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      {(["pending", "paid", "shipped", "delivered", "cancelled"] as const).map(
                        (s) => (
                          <SelectItem key={s} value={s} className="capitalize">
                            {s}
                          </SelectItem>
                        ),
                      )}
                    </SelectContent>
                  </Select>
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
                      <span>{formatUsdFromCents(it.priceCents * it.quantity)}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <Separator />

              <div className="text-sm space-y-1">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>{formatUsdFromCents(order.subtotalCents)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Shipping</span>
                  <span>{formatUsdFromCents(order.shippingCents)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tax</span>
                  <span>{formatUsdFromCents(order.taxCents)}</span>
                </div>
                <div className="flex justify-between font-medium">
                  <span>Total</span>
                  <span>{formatUsdFromCents(order.totalCents)}</span>
                </div>
              </div>

              <div className="pt-4">
                <AppLink href="/dashboard/admin/orders" className="text-primary hover:underline">
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
