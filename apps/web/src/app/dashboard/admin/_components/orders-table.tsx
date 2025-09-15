"use client"

import { Badge } from "@components/ui/badge"
import { Button } from "@components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@components/ui/dropdown-menu"
import { Input } from "@components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@components/ui/table"
import { Download, Filter, MoreHorizontal, Search } from "lucide-react"
import { useRouter } from "next/navigation"
import type React from "react"
import { useState } from "react"
import { DashboardEmptyState } from "@/app/dashboard/_components/empty-state"
import { orders } from "@/lib/admin-data"
import { links } from "@/lib/links"

export function OrdersTable(): React.ReactElement {
  const [searchTerm, setSearchTerm] = useState("")
  const router = useRouter()

  const filteredOrders = orders.filter(
    (order) =>
      order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.email.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const getStatusVariant = (status: string) => {
    switch (status) {
      case "Fulfilled":
        return "success"
      case "Unfulfilled":
        return "warning"
      case "Cancelled":
        return "destructive"
      default:
        return "secondary"
    }
  }

  const getPaymentStatusVariant = (status: string) => {
    switch (status) {
      case "Paid":
        return "success"
      case "Pending":
        return "warning"
      case "Refunded":
        return "secondary"
      default:
        return "secondary"
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Orders</CardTitle>
            <CardDescription>Recent orders from your store.</CardDescription>
          </div>
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
        <div className="flex items-center space-x-2">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search orders..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>
          <Button variant="outline" size="sm">
            <Filter className="mr-2 h-4 w-4" />
            Filter
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {filteredOrders.length === 0 ? (
          <DashboardEmptyState
            title={searchTerm ? "No results" : "No orders"}
            description={
              searchTerm
                ? "Try adjusting your search or filters."
                : "Orders will appear here when customers checkout."
            }
            variant={searchTerm ? "no-results" : "empty"}
            primaryAction={
              searchTerm ? (
                <Button variant="outline" onClick={() => setSearchTerm("")}>
                  Clear search
                </Button>
              ) : undefined
            }
          />
        ) : (
          <div className="w-full overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Payment</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium">
                      <div>
                        <div className="font-medium">{order.id}</div>
                        <div className="text-sm text-muted-foreground">
                          {order.items} item{order.items !== 1 ? "s" : ""}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="min-w-0">
                        <div className="font-medium truncate">{order.customer}</div>
                        <div className="text-sm text-muted-foreground truncate">{order.email}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusVariant(order.status)}>{order.status}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getPaymentStatusVariant(order.paymentStatus)}>
                        {order.paymentStatus}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">{order.total}</TableCell>
                    <TableCell>{order.date}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem
                            onClick={() =>
                              router.push(
                                links.getDashboardAdminEcommerceOrderDetailRoute(order.id),
                              )
                            }
                          >
                            View order
                          </DropdownMenuItem>
                          <DropdownMenuItem>Edit order</DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem>Mark as fulfilled</DropdownMenuItem>
                          <DropdownMenuItem>Send invoice</DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-red-600">Cancel order</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
