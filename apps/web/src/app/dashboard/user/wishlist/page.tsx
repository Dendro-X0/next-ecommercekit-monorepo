"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Heart, Plus, Share2, ShoppingCart, Trash2 } from "lucide-react"
import { useMemo } from "react"
import { DashboardHeader } from "@/app/dashboard/user/_components/dashboard-header"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { SafeImage } from "@/components/ui/safe-image"
import { SidebarInset } from "@/components/ui/sidebar"
import { wishlistApi } from "@/lib/data/wishlist"
import { useCartStore } from "@/lib/stores/cart"
import { WISHLIST_QK } from "@/lib/wishlist/query-keys"
import type { Product } from "@/types"
import type { Wishlist } from "@/types/user"
import { AppLink } from "../../../../../modules/shared/components/app-link"

export default function WishlistPage() {
  const queryClient = useQueryClient()
  const { addItem } = useCartStore()
  const { data, isLoading, error } = useQuery<Wishlist>({
    queryKey: WISHLIST_QK,
    queryFn: () => wishlistApi.getWishlist(),
    staleTime: 60_000,
  })
  const wishlist: Wishlist | null = data ?? null

  const breadcrumbs = [{ label: "Dashboard", href: "/dashboard/user" }, { label: "Wishlist" }]

  const totalItems: number = useMemo(() => (wishlist ? wishlist.items.length : 0), [wishlist])
  const removeMutation = useMutation<void, Error, string, { prev?: Wishlist }>({
    mutationFn: (productId: string) => wishlistApi.remove(productId),
    onMutate: async (productId) => {
      await queryClient.cancelQueries({ queryKey: WISHLIST_QK })
      const prev = queryClient.getQueryData<Wishlist>(WISHLIST_QK)
      if (prev) {
        const next: Wishlist = {
          ...prev,
          items: prev.items.filter((i) => i.productId !== productId),
        }
        queryClient.setQueryData(WISHLIST_QK, next)
      }
      return { prev }
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(WISHLIST_QK, ctx.prev)
    },
    onSettled: async () => {
      await queryClient.invalidateQueries({ queryKey: WISHLIST_QK })
    },
  })

  const toSlug = (input: string): string =>
    input
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "")

  return (
    <SidebarInset>
      <DashboardHeader title="Wishlist" breadcrumbs={breadcrumbs} />
      <div className="flex-1 space-y-6 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">My Wishlist</h2>
            <p className="text-muted-foreground">Save items you love for later</p>
          </div>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Create Wishlist
          </Button>
        </div>

        {/* Wishlist Statistics */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Items</CardTitle>
              <Heart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalItems}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Wishlists</CardTitle>
              <Heart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">1</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">In Stock</CardTitle>
              <ShoppingCart className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {wishlist ? wishlist.items.filter((i) => i.inStock).length : 0}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Wishlists */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Heart className="h-5 w-5" />
                    {wishlist?.name ?? "My Wishlist"}
                    {wishlist?.isPublic ? <Badge variant="outline">Public</Badge> : null}
                  </CardTitle>
                  <CardDescription>
                    {wishlist?.items.length ?? 0} items • Created {wishlist?.createdAt ?? "—"}
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm">
                    <Share2 className="mr-2 h-4 w-4" />
                    Share
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-muted-foreground">Loading wishlist...</div>
              ) : error ? (
                <div className="text-destructive">Failed to load wishlist</div>
              ) : wishlist && wishlist.items.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {wishlist.items.map((item) => (
                    <div key={item.id} className="border rounded-lg p-4 space-y-3">
                      <div className="relative w-full h-32 rounded overflow-hidden">
                        <SafeImage
                          src={`${item.image || "/placeholder.svg"}?height=128&width=256`}
                          alt={item.name}
                          fill
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                          className="object-cover"
                        />
                      </div>
                      <div>
                        <div className="font-medium">{item.name}</div>
                        <div className="text-lg font-bold">${item.price}</div>
                        <Badge variant={item.inStock ? "default" : "secondary"}>
                          {item.inStock ? "In Stock" : "Out of Stock"}
                        </Badge>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          className="flex-1"
                          disabled={!item.inStock}
                          onClick={() => {
                            const productFromWishlist: Product = {
                              id: item.productId,
                              name: item.name,
                              price: item.price,
                              category: "other",
                              description: "",
                              images: [item.image || ""],
                              inStock: item.inStock,
                              rating: 0,
                              reviewCount: 0,
                              tags: [],
                              slug: toSlug(item.name),
                            }
                            addItem(productFromWishlist, 1)
                          }}
                        >
                          <ShoppingCart className="mr-2 h-4 w-4" />
                          Add to Cart
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => removeMutation.mutate(item.productId)}
                          disabled={removeMutation.isPending}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Heart className="mx-auto h-12 w-12 mb-4 opacity-50" />
                  <p>This wishlist is empty</p>
                  <Button variant="outline" size="sm" className="mt-2 bg-transparent" asChild>
                    <AppLink href="/">Start Shopping</AppLink>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </SidebarInset>
  )
}
