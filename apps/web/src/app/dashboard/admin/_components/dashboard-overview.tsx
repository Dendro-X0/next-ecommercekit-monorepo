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
          {
            title: "Products",
            value: stats?.productsCount ?? 0,
            icon: Package,
            color: "text-blue-500",
            bgColor: "bg-blue-500/10",
            gradient: "from-blue-500/20 to-transparent"
          },
          {
            title: "Categories",
            value: stats?.categoriesCount ?? 0,
            icon: Users,
            color: "text-purple-500",
            bgColor: "bg-purple-500/10",
            gradient: "from-purple-500/20 to-transparent"
          },
          {
            title: "Featured",
            value: stats?.featuredProductsCount ?? 0,
            icon: DollarSign,
            color: "text-green-500",
            bgColor: "bg-green-500/10",
            gradient: "from-green-500/20 to-transparent"
          },
          {
            title: "Digital",
            value: stats?.digitalProductsCount ?? 0,
            icon: ShoppingCart,
            color: "text-orange-500",
            bgColor: "bg-orange-500/10",
            gradient: "from-orange-500/20 to-transparent"
          },
        ].map((item) => (
          <Card key={item.title} className="bg-card/50 backdrop-blur-sm border-border/50 overflow-hidden relative group hover:border-primary/50 transition-all duration-300">
            <div className={`absolute inset-0 bg-linear-to-br ${item.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none`} />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
              <CardTitle className="text-sm font-medium text-muted-foreground">{item.title}</CardTitle>
              <div className={`p-2 rounded-lg ${item.bgColor} group-hover:scale-110 transition-transform duration-300`}>
                <item.icon className={`h-4 w-4 ${item.color}`} />
              </div>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="text-2xl font-bold tracking-tight">{statsLoading ? "…" : item.value}</div>
              {statsError ? (
                <div className="text-xs text-red-600 mt-1">Failed to load</div>
              ) : (
                <p className="text-xs text-muted-foreground mt-1">Active records</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="bg-card/50 backdrop-blur-sm border-border/50">
        <CardHeader>
          <CardTitle>Recent Products</CardTitle>
          <CardDescription>
            {recentLoading ? "Loading…" : `${recent?.items?.length ?? 0} recently added items`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {recentError && (
            <div className="text-sm text-red-600 mb-4 bg-red-500/10 p-2 rounded">Failed to load recent products</div>
          )}
          <div className="space-y-4">
            {Array.isArray(recent?.items) && recent.items.filter(Boolean).map((p) => (
              <div
                key={p.id}
                className="flex items-center justify-between gap-4 p-3 rounded-xl hover:bg-muted/40 transition-colors border border-transparent hover:border-border/50"
              >
                <div className="flex items-center gap-4 min-w-0">
                  <div className="relative h-12 w-12 overflow-hidden rounded-lg bg-muted border border-border/50">
                    <Image
                      src={p.imageUrl || "/placeholder.svg"}
                      alt={p.name}
                      fill
                      sizes="48px"
                      className="object-cover"
                    />
                  </div>
                  <div className="min-w-0 space-y-1">
                    <p className="text-sm font-medium leading-none truncate">{p.name}</p>
                    <p className="text-xs text-muted-foreground truncate font-mono">{p.slug}</p>
                  </div>
                </div>
                <div className="text-right space-y-1">
                  <div className="text-sm font-bold font-mono">
                    {formatCurrency(centsToDollars(p.priceCents))}
                  </div>
                  <div className="text-[10px] uppercase tracking-wide text-muted-foreground">
                    {new Date(p.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
