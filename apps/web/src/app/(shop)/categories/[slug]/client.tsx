"use client"

import { keepPreviousData, useQuery } from "@tanstack/react-query"
import { type JSX, useMemo, useState } from "react"
import { ProductFilters } from "@/components/product/product-filters"
import { ProductGrid } from "@/components/product/product-grid"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { type ListProductsResponse, productsApi } from "@/lib/data/products"
import type { FilterOptions, Product } from "@/types"

interface CategoryPageClientProps {
  readonly params: Readonly<{ slug: string }>
  readonly initialData?: ListProductsResponse
}

/**
 * Category detail client page. Fetches products for the given category slug
 * and renders filters, sort, and a product grid.
 */
export default function CategoryPageClient({
  params,
  initialData,
}: CategoryPageClientProps): JSX.Element {
  const categorySlug: string = (params?.slug ?? "").toLowerCase()
  const [filters, setFilters] = useState<FilterOptions>({ categories: [], priceRange: [0, 500] })
  const [sortBy, setSortBy] = useState<string>("newest")
  const pageSize: number = 24

  const { data, isLoading, error } = useQuery<ListProductsResponse, Error, ListProductsResponse>({
    queryKey: ["products", { category: categorySlug, sort: sortBy, page: 1, pageSize }],
    queryFn: () => productsApi.list({ category: categorySlug, sort: sortBy, page: 1, pageSize }),
    placeholderData: keepPreviousData,
    staleTime: 60_000,
    initialData: sortBy === "newest" ? initialData : undefined,
  })

  const items: readonly Product[] = data?.items ?? []

  const filteredProducts: readonly Product[] = useMemo(() => {
    return items.filter((p) => {
      if (p.price < filters.priceRange[0] || p.price > filters.priceRange[1]) return false
      if (filters.inStock && !p.inStock) return false
      return true
    })
  }, [items, filters])

  const skeletonKeys: readonly string[] = useMemo(
    () => Array.from({ length: pageSize }, (_, i) => `cat-skel-${i}`),
    [],
  )

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">{toTitle(categorySlug)}</h1>
        {!isLoading && !error && (
          <p className="text-muted-foreground">Showing {filteredProducts.length} results</p>
        )}
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        <aside className="hidden lg:block w-64 shrink-0">
          <div className="sticky top-24">
            <ProductFilters filters={filters} onFiltersChange={setFilters} />
          </div>
        </aside>

        <div className="flex-1">
          <div className="flex items-center justify-between mb-6">
            <div />
            <Select value={sortBy} onValueChange={(v) => setSortBy(v)}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest</SelectItem>
                <SelectItem value="price_asc">Price: Low to High</SelectItem>
                <SelectItem value="price_desc">Price: High to Low</SelectItem>
                <SelectItem value="rating">Highest Rated</SelectItem>
                <SelectItem value="popularity">Most Popular</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {!isLoading && !error ? (
            filteredProducts.length > 0 ? (
              <ProductGrid products={[...filteredProducts]} priorityFirst={sortBy === "newest"} />
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground">
                <p className="mb-4">No products found in this category.</p>
                <Button
                  variant="outline"
                  onClick={() => setFilters({ categories: [], priceRange: [0, 500] })}
                >
                  Reset filters
                </Button>
              </div>
            )
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {skeletonKeys.map((k) => (
                <div key={k} className="space-y-3">
                  <div className="aspect-square rounded-lg overflow-hidden">
                    <Skeleton className="h-full w-full" />
                  </div>
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-6 w-1/3" />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function toTitle(slug: string): string {
  if (!slug) return "Category"
  return slug.replace(/-/g, " ").replace(/\b\w/g, (m) => m.toUpperCase())
}
