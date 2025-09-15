"use client"

import { useQuery } from "@tanstack/react-query"
import { Download, Eye, Package, Search } from "lucide-react"
import { type JSX, useId, useMemo, useState } from "react"
import { DashboardHeader } from "@/app/dashboard/user/_components/dashboard-header"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
import { ADMIN_ORDERS_QK } from "@/lib/admin/orders/query-keys"
import { type AdminOrder, adminApi } from "@/lib/data/admin-api"
import { AppLink } from "../../../../../modules/shared/components/app-link"

export default function AdminOrdersPage(): JSX.Element {
  const [searchTerm, setSearchTerm] = useState<string>("")
  const [status, setStatus] = useState<"all" | AdminOrder["status"]>("all")
  const statusFilterId = useId()
  const { data } = useQuery<Readonly<{ items: readonly AdminOrder[] }>>({
    queryKey: [...ADMIN_ORDERS_QK, status] as const,
    queryFn: () => adminApi.listOrders({ status: status === "all" ? undefined : status }),
    staleTime: 60_000,
  })
  const orders: readonly AdminOrder[] = data?.items ?? []

  const breadcrumbs = [{ label: "Dashboard", href: "/dashboard/admin" }, { label: "Orders" }]

  const filteredOrders = useMemo(() => {
    const term = searchTerm.trim().toLowerCase()
    return orders.filter((order) => order.id.toLowerCase().includes(term))
  }, [orders, searchTerm])

  function formatUsdFromCents(cents: number): string {
    const dollars = Math.round(cents) / 100
    return dollars.toLocaleString(undefined, { style: "currency", currency: "USD" })
  }

  const PAYMENT_REF_PREVIEW_LEN = 12

  function formatProvider(p?: AdminOrder["paymentProvider"]): string {
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
            <h2 className="text-3xl font-bold tracking-tight">All Orders</h2>
            <p className="text-muted-foreground">Admin view of all orders</p>
          </div>
          <Button variant="outline" className="w-full sm:w-auto">
            <Download className="mr-2 h-4 w-4" />
            Export Orders
          </Button>
        </div>

        <Card>
          <CardHeader>
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Orders
                </CardTitle>
                <CardDescription>Manage customer orders</CardDescription>
              </div>
              <div className="flex w-full flex-col gap-3 md:w-auto md:flex-row md:items-center">
                <div className="relative w-full md:w-64">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by order id..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8 w-full"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Label htmlFor={statusFilterId} className="whitespace-nowrap">
                    Status
                  </Label>
                  <Select value={status} onValueChange={(v) => setStatus(v as typeof status)}>
                    <SelectTrigger id={statusFilterId} className="w-[160px] capitalize">
                      <SelectValue placeholder="All" />
                    </SelectTrigger>
                    <SelectContent>
                      {(
                        ["all", "pending", "paid", "shipped", "delivered", "cancelled"] as const
                      ).map((s) => (
                        <SelectItem key={s} value={s} className="capitalize">
                          {s}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Payment</TableHead>
                  <TableHead>Payment Ref</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium">{order.id}</TableCell>
                    <TableCell>{new Date(order.createdAt).toLocaleString()}</TableCell>
                    <TableCell>{order.items.length} items</TableCell>
                    <TableCell>
                      <AdminOrderStatusBadge status={order.status} />
                    </TableCell>
                    <TableCell>{formatProvider(order.paymentProvider)}</TableCell>
                    <TableCell className="font-mono text-xs">
                      {previewRef(order.paymentRef)}
                    </TableCell>
                    <TableCell>{order.email ?? "-"}</TableCell>
                    <TableCell className="font-medium">
                      {formatUsdFromCents(order.totalCents)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button asChild size="sm" variant="ghost">
                        <AppLink href={`/dashboard/admin/orders/${order.id}`}>
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

function AdminOrderStatusBadge({ status }: { status: AdminOrder["status"] }): JSX.Element {
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
