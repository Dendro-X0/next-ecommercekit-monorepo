"use client"

import { useQuery } from "@tanstack/react-query"
import { Heart } from "lucide-react"
import dynamic from "next/dynamic"
import type { ReactElement } from "react"
import { useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { SidebarInset } from "@/components/ui/sidebar"
import { useSession } from "@/hooks/use-session"
import { ordersApi } from "@/lib/data/orders"
import { wishlistApi } from "@/lib/data/wishlist"
import { links } from "@/lib/links"
import type { Order } from "@/types/order"
import type { User, UserOrder, UserStats, Wishlist } from "@/types/user"
import { AppLink } from "../../../../modules/shared/components/app-link"
import { DashboardHeader } from "./_components/dashboard-header"
import { MembershipCard } from "./_components/membership-card"
import { QuickActions } from "./_components/quick-actions"
import { RecentOrders } from "./_components/recent-orders"

const SpendingCharts = dynamic(
  () => import("./_components/spending-charts").then((m) => m.SpendingCharts),
  {
    ssr: false,
    loading: () => (
      <div className="grid gap-6 md:grid-cols-2">
        {[0, 1].map((i) => (
          <Card key={i}>
            <CardHeader>
              <div className="h-5 w-40 bg-muted rounded animate-pulse" />
              <div className="mt-2 h-4 w-56 bg-muted rounded animate-pulse" />
            </CardHeader>
            <CardContent>
              <div className="h-[360px] w-full bg-muted rounded animate-pulse" />
            </CardContent>
          </Card>
        ))}
      </div>
    ),
  },
)

import { UserStatsCards } from "./_components/user-stats"
import { WishlistPreview } from "./_components/wishlist-preview"

// Constants (avoid magic numbers)
const MEMBERSHIP_TIER_THRESHOLDS = {
  Silver: 1000,
  Gold: 2500,
  Platinum: 5000,
} as const
const POINTS_PER_DOLLAR = 1 as const

// Defer Recommendations to improve LCP and reduce main bundle size
const LazyRecommendations = dynamic(
  () => import("./_components/recommendations").then((m) => m.RecommendationsCard),
  {
    ssr: false,
    loading: () => (
      <Card>
        <CardHeader>
          <div className="h-5 w-48 bg-muted rounded animate-pulse" />
          <div className="mt-2 h-4 w-56 bg-muted rounded animate-pulse" />
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="border rounded-lg p-4 space-y-2">
                <div className="w-full h-24 rounded bg-muted animate-pulse" />
                <div className="h-4 w-40 bg-muted rounded animate-pulse" />
                <div className="h-3 w-24 bg-muted rounded animate-pulse" />
                <div className="h-9 w-full bg-muted rounded animate-pulse" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    ),
  },
)

export default function UserDashboardPage(): ReactElement {
  const breadcrumbs = [{ label: "Dashboard" }]

  // Live data queries
  const {
    data: ordersData,
    isLoading: isOrdersLoading,
    isError: isOrdersError,
    refetch: refetchOrders,
  } = useQuery<readonly Order[]>({
    queryKey: ["orders", "list"],
    queryFn: ordersApi.list,
    staleTime: 60_000,
  })
  const {
    data: wishlist,
    isLoading: isWishlistLoading,
    isError: isWishlistError,
    refetch: refetchWishlist,
  } = useQuery<Wishlist>({
    queryKey: ["wishlist", "me"],
    queryFn: wishlistApi.getWishlist,
    staleTime: 60_000,
  })

  // Session for user name (fallbacks applied)
  const session = useSession()

  const orders: readonly Order[] = ordersData ?? []

  // Derive user stats from orders
  const stats: UserStats = useMemo(() => {
    const totalOrders: number = orders.length
    const totalSpent: number = orders.reduce((sum: number, o: Order) => sum + o.total, 0)
    const averageOrderValue: number = totalOrders > 0 ? totalSpent / totalOrders : 0
    const loyaltyPoints: number = Math.floor(totalSpent * POINTS_PER_DOLLAR)
    return {
      totalOrders,
      totalSpent,
      loyaltyPoints,
      savedAmount: 0,
      averageOrderValue,
      favoriteCategory: "—",
    }
  }, [orders])

  // Stable keys for loading skeletons
  const statsSkeletonKeys = useMemo<readonly string[]>(
    () => Array.from({ length: 5 }, (_v, i) => `usr-stats-skel-${i}`),
    [],
  )
  const chartsSkeletonKeys = useMemo<readonly string[]>(
    () => ["usr-charts-skel-0", "usr-charts-skel-1"] as const,
    [],
  )
  const recentOrdersSkeletonKeys = useMemo<readonly string[]>(
    () => Array.from({ length: 5 }, (_v, i) => `usr-recent-skel-${i}`),
    [],
  )
  const wishlistSkeletonKeys = useMemo<readonly string[]>(
    () => Array.from({ length: 3 }, (_v, i) => `usr-wishlist-skel-${i}`),
    [],
  )

  // Derive spending trend by month (Jan..Dec) from orders.createdAt
  const spendingData: Array<{ name: string; amount: number }> = useMemo(() => {
    const months: readonly string[] = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ] as const
    const totalsByMonth: number[] = Array.from({ length: 12 }, () => 0)
    for (const o of orders) {
      const d = new Date(o.createdAt)
      const idx = Number.isFinite(d.getMonth()) ? d.getMonth() : 0
      totalsByMonth[idx] += o.total
    }
    return months.map((m, i) => ({ name: m, amount: Math.round(totalsByMonth[i] * 100) / 100 }))
  }, [orders])

  // Category chart not derivable without product categories → show empty
  const categorySpending: Array<{ name: string; amount: number; percentage: number }> = []

  // Build minimal user summary for MembershipCard
  const userSummary: User = useMemo(() => {
    const name: string = session?.user?.name ?? "Your Account"
    const joinDate: string = new Date().toISOString()
    const membershipTier: User["membershipTier"] =
      stats.totalSpent >= MEMBERSHIP_TIER_THRESHOLDS.Platinum
        ? "Platinum"
        : stats.totalSpent >= MEMBERSHIP_TIER_THRESHOLDS.Gold
          ? "Gold"
          : stats.totalSpent >= MEMBERSHIP_TIER_THRESHOLDS.Silver
            ? "Silver"
            : "Bronze"
    return {
      id: session?.user?.id ?? "me",
      firstName: name.split(" ")[0] ?? name,
      lastName: name.split(" ").slice(1).join(" ") ?? "",
      name,
      email: session?.user?.email ?? "",
      phone: undefined,
      avatar: undefined,
      createdAt: joinDate,
      joinDate,
      membershipTier,
      totalSpent: stats.totalSpent,
      totalOrders: stats.totalOrders,
      loyaltyPoints: stats.loyaltyPoints,
      addresses: [],
      paymentMethods: [],
      preferences: {
        newsletter: false,
        notifications: true,
        smsUpdates: false,
        theme: "system",
      },
    }
  }, [session, stats])

  // Map orders to the light shape needed by RecentOrders
  const recentUserOrders: UserOrder[] = useMemo(() => {
    return orders.slice(0, 5).map((o) => ({
      id: o.id,
      orderNumber: o.id,
      date: new Date(o.createdAt).toLocaleDateString(),
      status:
        o.status === "delivered"
          ? "Delivered"
          : o.status === "shipped"
            ? "Shipped"
            : o.status === "paid"
              ? "Processing"
              : o.status === "cancelled"
                ? "Cancelled"
                : "Processing",
      total: o.total,
      items: [],
      trackingNumber: o.paymentRef,
    }))
  }, [orders])

  return (
    <SidebarInset>
      <DashboardHeader title="Dashboard" breadcrumbs={breadcrumbs} />
      <div className="flex-1 space-y-6 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Welcome back, {userSummary.name}!</h2>
            <p className="text-muted-foreground">
              Here&apos;s what&apos;s happening with your account today.
            </p>
          </div>
        </div>

        {/* User Statistics */}
        {isOrdersLoading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            {statsSkeletonKeys.map((k) => (
              <Card key={k}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <div className="h-4 w-24 bg-muted rounded animate-pulse" />
                  <div className="h-4 w-4 bg-muted rounded animate-pulse" />
                </CardHeader>
                <CardContent>
                  <div className="h-7 w-20 bg-muted rounded animate-pulse" />
                  <div className="mt-2 h-4 w-28 bg-muted rounded animate-pulse" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : isOrdersError ? (
          <Card>
            <CardHeader>
              <CardTitle>Stats unavailable</CardTitle>
              <CardDescription>We could not load your stats. Please try again.</CardDescription>
            </CardHeader>
            <CardContent>
              <Button size="sm" onClick={() => void refetchOrders()}>
                Retry
              </Button>
            </CardContent>
          </Card>
        ) : (
          <UserStatsCards stats={stats} />
        )}

        {/* Top Section - Membership and Quick Actions */}
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            {isOrdersLoading ? (
              <Card className="overflow-hidden">
                <div className="h-2 bg-muted" />
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-5 w-5 bg-muted rounded animate-pulse" />
                      <div className="h-5 w-40 bg-muted rounded animate-pulse" />
                    </div>
                    <div className="h-5 w-20 bg-muted rounded animate-pulse" />
                  </div>
                  <div className="h-4 w-48 bg-muted rounded animate-pulse" />
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="h-5 w-32 bg-muted rounded animate-pulse" />
                    <div className="h-5 w-20 bg-muted rounded animate-pulse" />
                  </div>
                  <div className="h-2 w-full bg-muted rounded animate-pulse" />
                </CardContent>
              </Card>
            ) : isOrdersError ? (
              <Card>
                <CardHeader>
                  <CardTitle>Membership unavailable</CardTitle>
                  <CardDescription>We could not load your membership details.</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button size="sm" onClick={() => void refetchOrders()}>
                    Retry
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <MembershipCard user={userSummary} />
            )}
          </div>
          <QuickActions />
        </div>

        {/* Spending Analytics */}
        {isOrdersLoading ? (
          <div className="grid gap-6 md:grid-cols-2">
            {chartsSkeletonKeys.map((k) => (
              <Card key={k}>
                <CardHeader>
                  <div className="h-5 w-40 bg-muted rounded animate-pulse" />
                  <div className="mt-2 h-4 w-56 bg-muted rounded animate-pulse" />
                </CardHeader>
                <CardContent>
                  <div className="h-[360px] w-full bg-muted rounded animate-pulse" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : isOrdersError ? (
          <Card>
            <CardHeader>
              <CardTitle>Analytics unavailable</CardTitle>
              <CardDescription>We could not load your spending analytics.</CardDescription>
            </CardHeader>
            <CardContent>
              <Button size="sm" onClick={() => void refetchOrders()}>
                Retry
              </Button>
            </CardContent>
          </Card>
        ) : (
          <SpendingCharts spendingData={spendingData} categoryData={categorySpending} />
        )}

        {/* Bottom Section */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Recent Orders */}
          {isOrdersLoading ? (
            <Card>
              <CardHeader>
                <div className="h-5 w-40 bg-muted rounded animate-pulse" />
                <div className="mt-2 h-4 w-56 bg-muted rounded animate-pulse" />
              </CardHeader>
              <CardContent>
                <div className="h-6 w-full bg-muted rounded animate-pulse mb-2" />
                {recentOrdersSkeletonKeys.map((k) => (
                  <div key={k} className="h-10 w-full bg-muted rounded animate-pulse mb-2" />
                ))}
              </CardContent>
            </Card>
          ) : isOrdersError ? (
            <Card>
              <CardHeader>
                <CardTitle>Orders unavailable</CardTitle>
                <CardDescription>We couldn&apos;t load your recent orders.</CardDescription>
              </CardHeader>
              <CardContent>
                <Button size="sm" onClick={() => void refetchOrders()}>
                  Retry
                </Button>
              </CardContent>
            </Card>
          ) : recentUserOrders.length === 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>No recent orders</CardTitle>
                <CardDescription>Your recent orders will appear here.</CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" size="sm" asChild>
                  <AppLink href={links.getShopHomeRoute()}>Start Shopping</AppLink>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <RecentOrders orders={recentUserOrders} />
          )}

          {/* Wishlist Preview */}
          {isWishlistLoading ? (
            <Card>
              <CardHeader>
                <div className="h-5 w-40 bg-muted rounded animate-pulse" />
                <div className="mt-2 h-4 w-56 bg-muted rounded animate-pulse" />
              </CardHeader>
              <CardContent>
                {wishlistSkeletonKeys.map((k) => (
                  <div key={k} className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-lg bg-muted animate-pulse" />
                    <div className="flex-1">
                      <div className="h-4 w-40 bg-muted rounded animate-pulse mb-2" />
                      <div className="h-3 w-24 bg-muted rounded animate-pulse" />
                    </div>
                    <div className="h-6 w-16 bg-muted rounded animate-pulse" />
                  </div>
                ))}
              </CardContent>
            </Card>
          ) : isWishlistError ? (
            <Card>
              <CardHeader>
                <CardTitle>Wishlist unavailable</CardTitle>
                <CardDescription>We couldn&apos;t load your wishlist.</CardDescription>
              </CardHeader>
              <CardContent>
                <Button size="sm" onClick={() => void refetchWishlist()}>
                  Retry
                </Button>
              </CardContent>
            </Card>
          ) : !wishlist || (wishlist.items?.length ?? 0) === 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>Wishlist</CardTitle>
                <CardDescription>Items you&apos;re interested in</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-muted-foreground">
                  <Heart className="mx-auto h-12 w-12 mb-4 opacity-50" />
                  <p>Your wishlist is empty</p>
                  <Button variant="outline" size="sm" className="mt-2 bg-transparent" asChild>
                    <AppLink href={links.getShopHomeRoute()}>Start Shopping</AppLink>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <WishlistPreview wishlist={wishlist} maxItems={3} />
          )}
        </div>

        {/* Recommendations (lazy-loaded) */}
        <LazyRecommendations />
      </div>
    </SidebarInset>
  )
}
