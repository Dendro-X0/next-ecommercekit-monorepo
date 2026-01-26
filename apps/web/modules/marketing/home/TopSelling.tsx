"use client"

import { useQuery } from "@tanstack/react-query"
import { getLocaleFromPath } from "modules/shared/lib/i18n/config"
import { formatCurrency } from "modules/shared/lib/i18n/format"
import { usePathname } from "next/navigation"
import { type ReactElement, useEffect, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { SafeImage } from "@/components/ui/safe-image"
import { Skeleton } from "@/components/ui/skeleton"
import { StarRating } from "@/components/ui/star-rating"
import { type ListProductsResponse, productsApi } from "@/lib/data/products"
import { showToast } from "@/lib/utils/toast"
import type { Product } from "@/types"
import { AppLink } from "../../shared/components/app-link"

/**
 * Top-selling products section fetching live data via TanStack Query.
 * Shows skeletons while loading and a toast on error.
 */
type TopSellingProps = Readonly<{
  initialData?: Readonly<{ items: readonly Product[] }>
}>

export function TopSelling({ initialData }: TopSellingProps): ReactElement {
  const pathname: string = usePathname() ?? "/"
  const locale = getLocaleFromPath(pathname)
  const { data, isLoading, error } = useQuery<ListProductsResponse>({
    queryKey: ["products", "top-selling"],
    queryFn: () => productsApi.list({ page: 1, pageSize: 12 }),
    staleTime: 60_000,
    initialData:
      initialData && Array.isArray(initialData.items)
        ? ({
          items: initialData.items,
          total: initialData.items.length,
          page: 1,
          pageSize: initialData.items.length,
        } as ListProductsResponse)
        : undefined,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  })
  const items: readonly Product[] = (data?.items ?? [])
    .slice()
    .sort((a, b) => b.reviewCount - a.reviewCount)
    .slice(0, 4)

  useEffect(() => {
    if (error) {
      const message: string = error instanceof Error ? error.message : "Failed to load products"
      showToast(message, { type: "error" })
    }
  }, [error])

  // Stable, deterministic keys to avoid SSR/CSR hydration mismatch in dev/prod
  const skeletonKeys = useMemo<readonly string[]>(
    () => Array.from({ length: 4 }, (_v, i) => `top-selling-skel-${i}`),
    [],
  )

  return (
    <section className="py-16 bg-white dark:bg-gray-900 min-h-[720px]">
      <div className="container mx-auto px-4">
        <div className="flex flex-col items-center mb-16 space-y-2">
          <span className="text-sm font-semibold tracking-wider text-primary uppercase">Curated for you</span>
          <h2 className="text-3xl md:text-4xl font-bold text-center text-foreground tracking-tight">Top Selling Products</h2>
        </div>

        {isLoading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {skeletonKeys.map((k) => (
              <Card key={k} className="border-0 shadow-none bg-transparent">
                <CardContent className="p-0">
                  <div className="aspect-square rounded-lg overflow-hidden mb-4">
                    <Skeleton className="h-full w-full" />
                  </div>
                  <div className="space-y-2">
                    <Skeleton className="h-5 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-6 w-1/3" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {error && !isLoading && (
          <div className="text-center py-8 text-red-600">Failed to load products.</div>
        )}

        {!isLoading && !error && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {items.map((product) => (
              <Card key={product.id} className="group border border-border/80 shadow-md hover:shadow-xl hover:shadow-primary/10 transition-all duration-500 hover:-translate-y-2 bg-card overflow-hidden rounded-2xl">
                <CardContent className="p-0">
                  <AppLink href={`/products/${product.slug}`} className="block h-full">
                    <div className="aspect-square bg-muted/20 overflow-hidden relative">
                      <div className="relative w-full h-full">
                        <SafeImage
                          src={product.images?.[0] || "/placeholder.svg"}
                          alt={product.name}
                          fill
                          sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
                          fetchPriority="low"
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                    </div>

                    <div className="p-5 space-y-3">
                      <div className="space-y-1">
                        <h3 className="font-semibold text-lg text-foreground group-hover:text-primary transition-colors line-clamp-1">
                          {product.name}
                        </h3>
                        <div className="flex items-center gap-2">
                          <StarRating rating={product.rating} />
                          <span className="text-xs text-muted-foreground font-medium">
                            ({product.reviewCount} reviews)
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-2">
                        <div className="flex items-baseline gap-2">
                          <span className="text-xl font-bold text-foreground">
                            {formatCurrency(locale, product.price)}
                          </span>
                          {product.originalPrice && (
                            <span className="text-sm text-muted-foreground line-through decoration-muted-foreground/60">
                              {formatCurrency(locale, product.originalPrice)}
                            </span>
                          )}
                        </div>
                        <Button size="sm" variant="secondary" className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-full h-8 px-4 text-xs font-medium">
                          View
                        </Button>
                      </div>
                    </div>
                  </AppLink>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <div className="text-center">
          <Button
            variant="outline"
            asChild
            className="border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-800 bg-transparent"
          >
            <AppLink href="/shop">View All</AppLink>
          </Button>
        </div>
      </div>
    </section>
  )
}
