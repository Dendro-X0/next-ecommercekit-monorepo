"use client"

import { useQuery } from "@tanstack/react-query"
import { Download, Eye, Package, Search } from "lucide-react"
import { type JSX, useMemo, useState } from "react"
import { DashboardHeader } from "@/app/dashboard/user/_components/dashboard-header"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { SidebarInset } from "@/components/ui/sidebar"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { ordersApi } from "@/lib/data/orders"
import { ORDERS_QK } from "@/lib/orders/query-keys"
import type { Order, OrderStatus } from "@/types/order"
import { AppLink } from "../../../../../modules/shared/components/app-link"

export default function OrdersPage() {
  const [searchTerm, setSearchTerm] = useState<string>("")
  const [statusFilter, setStatusFilter] = useState<"all" | OrderStatus>("all")
  const { data } = useQuery<readonly Order[]>({
    queryKey: ORDERS_QK,
    queryFn: ordersApi.list,
    staleTime: 60_000,
  })
  const orders: readonly Order[] = data ?? []

  const breadcrumbs = [{ label: "Dashboard", href: "/dashboard/user" }, { label: "Orders" }]

  const filteredOrders = useMemo(() => {
    const term = searchTerm.trim().toLowerCase()
    return orders.filter((order) => {
      const matchesTerm = order.id.toLowerCase().includes(term)
      const matchesStatus = statusFilter === "all" ? true : order.status === statusFilter
      return matchesTerm && matchesStatus
    })
  }, [orders, searchTerm, statusFilter])

  const PAYMENT_REF_PREVIEW_LEN = 12

  function formatProvider(p?: Order["paymentProvider"]): string {
    if (!p) return "-"
    return p.charAt(0).toUpperCase() + p.slice(1)
  }

  function previewRef(ref?: string): string {
    if (!ref) return "-"
    return ref.length > PAYMENT_REF_PREVIEW_LEN ? `${ref.slice(0, PAYMENT_REF_PREVIEW_LEN)}…` : ref
  }

  return (
    <SidebarInset>
      <DashboardHeader title="Orders" breadcrumbs={breadcrumbs} />
      <div className="flex-1 space-y-6 p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Order History</h2>
            <p className="text-muted-foreground">Track and manage all your orders</p>
          </div>
          <Button variant="outline" className="w-full sm:w-auto">
            <Download className="mr-2 h-4 w-4" />
            Export Orders
          </Button>
        </div>

        {/* Order Statistics */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{orders.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Delivered</CardTitle>
              <Package className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {orders.filter((o) => o.status === "delivered").length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">In Transit</CardTitle>
              <Package className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {orders.filter((o) => o.status === "shipped").length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Processing</CardTitle>
              <Package className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {orders.filter((o) => o.status === "pending").length}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  All Orders
                </CardTitle>
                <CardDescription>Complete history of your purchases</CardDescription>
              </div>
              <div className="flex w-full flex-col gap-2 md:w-auto md:flex-row md:items-center">
                <div className="relative w-full md:w-auto">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search orders..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8 w-full md:w-64"
                  />
                </div>
                <Select
                  value={statusFilter}
                  onValueChange={(v: "all" | OrderStatus) => setStatusFilter(v)}
                >
                  <SelectTrigger className="w-36">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                    <SelectItem value="shipped">Shipped</SelectItem>
                    <SelectItem value="delivered">Delivered</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead>Payment</TableHead>
                  <TableHead>Payment Ref</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium">{order.id}</TableCell>
                    <TableCell>{new Date(order.createdAt).toLocaleString()}</TableCell>
                    <TableCell>
                      <OrderStatusBadge status={order.status} />
                    </TableCell>
                    <TableCell>{(order.items?.length ?? 0)} items</TableCell>
                    <TableCell>{formatProvider(order.paymentProvider)}</TableCell>
                    <TableCell className="font-mono text-xs">
                      {previewRef(order.paymentRef)}
                    </TableCell>
                    <TableCell className="font-medium">${order.total.toFixed(2)}</TableCell>
                    <TableCell className="text-right">
                      <Button asChild size="sm" variant="ghost">
                        <AppLink href={`/dashboard/user/orders/${order.id}`}>
                          <Eye className="h-4 w-4" />
                        </AppLink>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </SidebarInset>
  )
}

function OrderStatusBadge({ status }: { status: OrderStatus }): JSX.Element {
  const variant: "success" | "secondary" | "warning" | "default" | "destructive" =
    status === "delivered"
      ? "success"
      : status === "shipped"
        ? "secondary"
        : status === "pending"
          ? "warning"
          : status === "paid"
            ? "default"
            : "destructive"
  const label: string = status.charAt(0).toUpperCase() + status.slice(1)
  return <Badge variant={variant}>{label}</Badge>
}
