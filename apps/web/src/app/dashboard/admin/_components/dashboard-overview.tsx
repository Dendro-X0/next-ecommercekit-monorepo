"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@components/ui/card"
import { useQuery } from "@tanstack/react-query"
import { DollarSign, Package, ShoppingCart, Users } from "lucide-react"
import Image from "next/image"
import { type AdminStats, adminApi, type RecentProduct } from "@/lib/data/admin-api"

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(amount)
}

const centsToDollars = (cents: number): number => Math.round(cents) / 100

export function DashboardOverview(): React.ReactElement {
  const {
    data: stats,
    isLoading: statsLoading,
    isError: statsError,
  } = useQuery<AdminStats>({
    queryKey: ["admin", "stats"],
    queryFn: (): Promise<AdminStats> => adminApi.stats(),
    staleTime: 60_000,
  })
  const {
    data: recent,
    isLoading: recentLoading,
    isError: recentError,
  } = useQuery<Readonly<{ items: readonly RecentProduct[] }>>({
    queryKey: ["admin", "recent-products"],
    queryFn: (): Promise<Readonly<{ items: readonly RecentProduct[] }>> =>
      adminApi.recentProducts(8),
    staleTime: 60_000,
  })

  return (
    <div className="space-y-8">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[
          { title: "Products", value: stats?.productsCount ?? 0, icon: Package },
          { title: "Categories", value: stats?.categoriesCount ?? 0, icon: Users },
          { title: "Featured", value: stats?.featuredProductsCount ?? 0, icon: DollarSign },
          { title: "Digital", value: stats?.digitalProductsCount ?? 0, icon: ShoppingCart },
        ].map((item) => (
          <Card key={item.title} className="transition-all hover:shadow-md">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{item.title}</CardTitle>
              <item.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statsLoading ? "…" : item.value}</div>
              {statsError && <div className="text-xs text-red-600">Failed to load</div>}
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Products</CardTitle>
          <CardDescription>
            {recentLoading ? "Loading…" : `${recent?.items?.length ?? 0} recently added`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {recentError && (
            <div className="text-sm text-red-600">Failed to load recent products</div>
          )}
          <div className="space-y-4">
            {(recent?.items ?? []).map((p) => (
              <div
                key={p.id}
                className="flex items-center justify-between gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-4 min-w-0">
                  <div className="relative h-10 w-10 overflow-hidden rounded-md bg-muted">
                    <Image
                      src={p.imageUrl || "/placeholder.svg"}
                      alt={p.name}
                      fill
                      sizes="40px"
                      className="object-cover"
                    />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium leading-none truncate">{p.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{p.slug}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium">
                    {formatCurrency(centsToDollars(p.priceCents))}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(p.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
