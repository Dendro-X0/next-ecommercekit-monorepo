"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@components/ui/avatar"
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
import { useQuery } from "@tanstack/react-query"
import { Filter, MoreHorizontal, Search, UserPlus } from "lucide-react"
import type React from "react"
import { useMemo, useState } from "react"
import { DashboardEmptyState } from "@/app/dashboard/_components/empty-state"
import { ADMIN_CUSTOMERS_QK, ADMIN_CUSTOMERS_SEARCH_QK } from "@/lib/admin/customers/query-keys"
import { type AdminCustomer, adminApi } from "@/lib/data/admin-api"

export function CustomersTable(): React.ReactElement {
  const [searchTerm, setSearchTerm] = useState("")
  const [page, setPage] = useState<number>(1)
  const limit: number = 100
  const baseKey =
    searchTerm.trim().length > 0 ? ADMIN_CUSTOMERS_SEARCH_QK(searchTerm.trim()) : ADMIN_CUSTOMERS_QK
  const queryKey = useMemo(
    () => [...baseKey, "page", page, "limit", limit] as const,
    [baseKey, page],
  )
  const { data, isLoading, isError, error } = useQuery<
    Readonly<{ items: readonly AdminCustomer[] }>
  >({
    queryKey,
    queryFn: () => adminApi.listCustomers({ query: searchTerm.trim() || undefined, limit, page }),
    staleTime: 60_000,
  })
  const rows: readonly AdminCustomer[] = data?.items ?? []

  const getStatusVariant = (status: string) => {
    switch (status) {
      case "Active":
        return "success"
      case "VIP":
        return "default"
      case "Inactive":
        return "secondary"
      default:
        return "secondary"
    }
  }

  function formatUsdFromCents(cents: number): string {
    const dollars = Math.round(cents) / 100
    return dollars.toLocaleString(undefined, { style: "currency", currency: "USD" })
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Customers</CardTitle>
            <CardDescription>Manage your customer relationships and data.</CardDescription>
          </div>
          <Button>
            <UserPlus className="mr-2 h-4 w-4" />
            Add Customer
          </Button>
        </div>
        <div className="flex items-center space-x-2">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search customers..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value)
                setPage(1)
              }}
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
        {isLoading ? (
          <div className="py-10 text-center text-sm text-muted-foreground">
            Loading customers...
          </div>
        ) : isError ? (
          <div className="py-10 text-center text-sm text-red-600">
            {(error as Error)?.message ?? "Failed to load customers"}
          </div>
        ) : rows.length === 0 ? (
          <DashboardEmptyState
            title={searchTerm ? "No results" : "No customers"}
            description={
              searchTerm
                ? "Try adjusting your search or filters."
                : "Invite or add your first customer."
            }
            variant={searchTerm ? "no-results" : "empty"}
            primaryAction={
              searchTerm ? (
                <Button variant="outline" onClick={() => setSearchTerm("")}>
                  Clear search
                </Button>
              ) : (
                <Button>
                  <UserPlus className="mr-2 h-4 w-4" />
                  Add Customer
                </Button>
              )
            }
          />
        ) : (
          <div className="w-full overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer</TableHead>
                  <TableHead>Orders</TableHead>
                  <TableHead>Total Spent</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Join Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((customer) => (
                  <TableRow key={customer.id}>
                    <TableCell>
                      <div className="flex items-center space-x-3 min-w-0">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={customer.imageUrl} alt={customer.name} />
                          <AvatarFallback>
                            {customer.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <div className="font-medium truncate">{customer.name}</div>
                          <div className="text-sm text-muted-foreground truncate">
                            {customer.email}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">{customer.ordersCount}</TableCell>
                    <TableCell className="font-medium">
                      {formatUsdFromCents(customer.totalSpentCents)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusVariant(customer.status)}>{customer.status}</Badge>
                    </TableCell>
                    <TableCell>{new Date(customer.createdAt).toLocaleDateString()}</TableCell>
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
                          <DropdownMenuItem>View profile</DropdownMenuItem>
                          <DropdownMenuItem>View orders</DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem>Send email</DropdownMenuItem>
                          <DropdownMenuItem>Edit customer</DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-red-600">
                            Delete customer
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <div className="mt-4 flex items-center justify-between">
              <div className="text-sm text-muted-foreground">Page {page}</div>
              <div className="space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={isLoading || page === 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={isLoading || rows.length < limit}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
