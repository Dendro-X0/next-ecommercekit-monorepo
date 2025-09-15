"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Filter, MoreHorizontal, Plus, Search } from "lucide-react"
import NextImage from "next/image"
import { useRouter } from "next/navigation"
import type React from "react"
import { useMemo, useState } from "react"
import { toast } from "sonner"
import { DashboardEmptyState } from "@/app/dashboard/_components/empty-state"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { productsApi } from "@/lib/data/products"
import { links } from "@/lib/links"
import type { Product } from "@/types"
import { AppLink } from "../../../../../modules/shared/components/app-link"
import ConfirmDialog from "./confirm-dialog"

export function ProductsTable(): React.ReactElement {
  const router = useRouter()
  const qc = useQueryClient()
  const [searchTerm, setSearchTerm] = useState("")
  const [pendingDelete, setPendingDelete] = useState<Product | null>(null)
  const { data, isLoading, error } = useQuery<{
    readonly items: readonly Product[]
    readonly total: number
    readonly page: number
    readonly pageSize: number
  }>({
    queryKey: ["admin-products", { searchTerm }],
    queryFn: async () => {
      const res = await productsApi.list({ query: searchTerm || undefined, pageSize: 50 })
      return res
    },
    staleTime: 60_000,
  })
  const items: readonly Product[] = data?.items ?? []
  const filteredProducts: readonly Product[] = useMemo(() => {
    const term = searchTerm.trim().toLowerCase()
    if (!term) return items
    return items.filter(
      (p) => p.name.toLowerCase().includes(term) || p.category.toLowerCase().includes(term),
    )
  }, [items, searchTerm])
  const { mutate: deleteProduct, isPending: isDeleting } = useMutation<
    { ok: boolean },
    Error,
    string
  >({
    mutationFn: async (id: string) => {
      const ok = await productsApi.deleteById(id)
      if (!ok) throw new Error("Delete failed")
      return { ok }
    },
    onSuccess: async () => {
      toast.success("Product deleted")
      await qc.invalidateQueries({ queryKey: ["admin-products"] })
    },
    onError: (e: Error) => toast.error(e.message || "Failed to delete product"),
  })

  // Stable keys for loading skeleton rows
  const skeletonKeys: readonly string[] = useMemo(
    () =>
      Array.from(
        { length: 6 },
        () => globalThis.crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2),
      ),
    [],
  )

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Products</CardTitle>
            <CardDescription>Manage your product inventory and pricing.</CardDescription>
          </div>
          <Button asChild>
            <AppLink href={links.getDashboardAdminEcommerceProductCreateRoute()}>
              <Plus className="mr-2 h-4 w-4" />
              Add Product
            </AppLink>
          </Button>
        </div>
        <div className="flex items-center space-x-2">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search products..."
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
        {isLoading ? (
          <div className="grid gap-3">
            {skeletonKeys.map((k) => (
              <div key={k} className="flex items-center gap-4">
                <Skeleton className="h-12 w-12 rounded-md" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-1/3" />
                  <Skeleton className="h-3 w-1/4" />
                </div>
                <Skeleton className="h-8 w-24" />
              </div>
            ))}
          </div>
        ) : error ? (
          <DashboardEmptyState
            title="Failed to load"
            description="Please try again later."
            variant="no-results"
            primaryAction={
              <Button
                variant="outline"
                onClick={() => qc.invalidateQueries({ queryKey: ["admin-products"] })}
              >
                Retry
              </Button>
            }
          />
        ) : filteredProducts.length === 0 ? (
          <DashboardEmptyState
            title={searchTerm ? "No results" : "No products"}
            description={
              searchTerm
                ? "Try adjusting your search or filters."
                : "Get started by adding your first product."
            }
            variant={searchTerm ? "no-results" : "empty"}
            primaryAction={
              searchTerm ? (
                <Button variant="outline" onClick={() => setSearchTerm("")}>
                  Clear search
                </Button>
              ) : (
                <Button asChild>
                  <AppLink href={links.getDashboardAdminEcommerceProductCreateRoute()}>
                    Add Product
                  </AppLink>
                </Button>
              )
            }
          />
        ) : (
          <div className="w-full overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px]">Image</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell>
                      <div className="relative h-12 w-12 rounded-md overflow-hidden">
                        <NextImage
                          src={`${product.images?.[0] ?? "/placeholder.svg"}?height=48&width=48`}
                          alt={product.name}
                          fill
                          sizes="48px"
                          className="object-cover"
                        />
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">
                      <div>
                        <div className="font-medium">{product.name}</div>
                        <div className="text-sm text-muted-foreground">{product.id}</div>
                      </div>
                    </TableCell>
                    <TableCell>{product.category}</TableCell>
                    <TableCell className="font-medium">
                      {new Intl.NumberFormat("en-US", {
                        style: "currency",
                        currency: "USD",
                      }).format(product.price)}
                    </TableCell>
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
                          <DropdownMenuItem>View details</DropdownMenuItem>
                          <DropdownMenuItem
                            onSelect={() =>
                              router.push(
                                links.getDashboardAdminEcommerceProductEditRoute(product.id),
                              )
                            }
                          >
                            Edit product
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onSelect={() =>
                              router.push(links.getDashboardAdminEcommerceProductCreateRoute())
                            }
                          >
                            Duplicate
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-red-600"
                            disabled={isDeleting}
                            onSelect={() => setPendingDelete(product)}
                          >
                            Delete product
                          </DropdownMenuItem>
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
      <ConfirmDialog
        open={!!pendingDelete}
        title="Delete product"
        description={
          pendingDelete
            ? `Are you sure you want to delete “${pendingDelete.name}”? This action cannot be undone.`
            : undefined
        }
        confirmLabel="Delete"
        cancelLabel="Cancel"
        variant="destructive"
        loading={isDeleting}
        onConfirm={() => {
          if (!pendingDelete) return
          deleteProduct(pendingDelete.id)
          setPendingDelete(null)
        }}
        onCancel={() => setPendingDelete(null)}
        onOpenChange={(open) => {
          if (!open) setPendingDelete(null)
        }}
      />
    </Card>
  )
}
