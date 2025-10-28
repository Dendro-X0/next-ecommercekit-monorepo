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
  const pathname = usePathname()
  const locale = getLocaleFromPath(pathname)
  const { data, isLoading, error } = useQuery<ListProductsResponse>({
    queryKey: ["products", "top-selling"],
    queryFn: () => productsApi.list({ page: 1, pageSize: 12 }),
    staleTime: 60_000,
    initialData:
      initialData && Array.isArray(initialData.items) ? { items: initialData.items, total: initialData.items.length, page: 1, pageSize: initialData.items.length } as ListProductsResponse : undefined,
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
    <section className="py-16 bg-white dark:bg-gray-900 min-h-[680px]">
      <div className="container mx-auto px-4">
        <h2 className="section-title mb-12 text-black dark:text-white">TOP SELLING</h2>

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
              <Card key={product.id} className="group border-0 shadow-none bg-transparent">
                <CardContent className="p-0">
                  <AppLink href={`/products/${product.slug}`}>
                    <div className="aspect-square bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden mb-4">
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

                    <div className="space-y-2">
                      <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-100 group-hover:text-black dark:group-hover:text-white transition-colors line-clamp-2 min-h-[3rem]">
                        {product.name}
                      </h3>

                      <div className="flex items-center gap-2 h-5">
                        <StarRating rating={product.rating} />
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          {product.rating}/5 ({product.reviewCount})
                        </span>
                      </div>

                      <div className="flex items-center gap-2 min-h-[1.75rem]">
                        <span className="text-xl font-bold text-black dark:text-white">
                          {formatCurrency(locale, product.price)}
                        </span>
                        {product.originalPrice && (
                          <span className="text-lg text-gray-500 dark:text-gray-400 line-through">
                            {formatCurrency(locale, product.originalPrice)}
                          </span>
                        )}
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
