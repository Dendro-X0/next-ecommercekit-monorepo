"use client"

import { keepPreviousData, useQuery } from "@tanstack/react-query"
import { Filter, SlidersHorizontal } from "lucide-react"
import dynamic from "next/dynamic"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import type { JSX } from "react"
import { useDeferredValue, useEffect, useId, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Skeleton } from "@/components/ui/skeleton"
import { isDigitalProduct } from "@/lib/cart/utils"
import { sortOptions } from "@/lib/data"
import { type ListProductsResponse, productsApi } from "@/lib/data/products"
import { productsDisabled } from "@/lib/safe-mode"
import { mapSortToApi } from "@/lib/utils/product-sort"
import { showToast } from "@/lib/utils/toast"
import type { FilterOptions, Product } from "@/types"

/**
 * Client-only Shop page. Split from server wrapper to avoid
 * sending heavy code in safe mode.
 */
type ShopPageClientProps = Readonly<{
  initialData?: ListProductsResponse
}>

export default function ShopPageClient({ initialData }: ShopPageClientProps): JSX.Element {
  const isDisabled: boolean = productsDisabled
  // Fixed page size used across the view (also for skeletons)
  const productsPerPage: number = 12
  const skeletonKeys: readonly string[] = useMemo(
    () => Array.from({ length: productsPerPage }, (_v, i) => `shop-skel-${i}`),
    [],
  )
  // Lazy-load filters and grid to reduce initial bundle/CPU
  const ProductFilters = useMemo(
    () =>
      dynamic(() => import("@/components/product/product-filters").then((m) => m.ProductFilters), {
        ssr: false,
        loading: () => <div className="text-sm text-muted-foreground">Loading filters…</div>,
      }),
    [],
  )
  const ProductGrid = useMemo(
    () =>
      dynamic(() => import("@/components/product/product-grid").then((m) => m.ProductGrid), {
        ssr: false,
        loading: () => (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {skeletonKeys.map((k) => (
              <div key={`dg-${k}`} className="space-y-3">
                <div className="aspect-square rounded-lg overflow-hidden">
                  <Skeleton className="h-full w-full" />
                </div>
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-6 w-1/3" />
              </div>
            ))}
          </div>
        ),
      }),
    [skeletonKeys],
  )

  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const uid = useId()
  const sortSelectId = `${uid}-sort-select`

  const getInt = (v: string | null, fallback: number): number => {
    const n = Number(v)
    return Number.isFinite(n) && n > 0 ? n : fallback
  }
  const initialSort: string = searchParams.get("sort") ?? "newest"
  const initialPage: number = getInt(searchParams.get("page"), 1)

  const [filters, setFilters] = useState<FilterOptions>({
    categories: [],
    priceRange: [0, 500],
    inStock: undefined,
  })
  const deferredFilters: FilterOptions = useDeferredValue(filters)
  const [sortBy, setSortBy] = useState<string>(initialSort)
  const [currentPage, setCurrentPage] = useState<number>(initialPage)

  const updateUrl = (next: Readonly<{ page?: number; sort?: string }>): void => {
    const usp = new URLSearchParams(searchParams.toString())
    if (typeof next.page === "number") usp.set("page", String(next.page))
    if (typeof next.sort === "string") usp.set("sort", next.sort)
    if (typeof next.sort === "string" && !("page" in next)) usp.set("page", "1")
    router.replace(`${pathname}?${usp.toString()}`)
  }

  const serverCategory: string | undefined =
    deferredFilters.categories?.length === 1 ? deferredFilters.categories[0] : undefined

  const apiSort: string = mapSortToApi(sortBy)

  const { data, isLoading, error } = useQuery<ListProductsResponse, Error, ListProductsResponse>({
    queryKey: [
      "products",
      { page: currentPage, pageSize: productsPerPage, sort: apiSort, category: serverCategory },
    ],
    queryFn: () =>
      productsApi.list({
        page: currentPage,
        pageSize: productsPerPage,
        sort: apiSort,
        category: serverCategory,
      }),
    placeholderData: keepPreviousData,
    staleTime: 60_000,
    enabled: !isDisabled,
    // Use initial server-rendered data only for the default view (page 1, newest, no category)
    initialData:
      initialData &&
      currentPage === 1 &&
      apiSort === "newest" &&
      (serverCategory ?? "") === ""
        ? initialData
        : undefined,
  })
  const items = data?.items ?? []

  useEffect(() => {
    if (error) {
      const message: string = error instanceof Error ? error.message : "Failed to load products"
      showToast(message, { type: "error" })
    }
  }, [error])

  const filteredAndSortedProducts = useMemo(() => {
    const filtered = items.filter((product: Product) => {
      if (
        product.price < deferredFilters.priceRange[0] ||
        product.price > deferredFilters.priceRange[1]
      ) {
        return false
      }
      if (deferredFilters.inStock && !product.inStock) {
        return false
      }
      if (deferredFilters.kind === "digital" && !isDigitalProduct(product)) {
        return false
      }
      if (deferredFilters.kind === "physical" && isDigitalProduct(product)) {
        return false
      }
      return true
    })
    if (sortBy === "rating") filtered.sort((a: Product, b: Product) => b.rating - a.rating)
    if (sortBy === "popularity")
      filtered.sort((a: Product, b: Product) => b.reviewCount - a.reviewCount)
    return filtered
  }, [deferredFilters, sortBy, items])

  const totalItems: number = data?.total ?? 0
  const totalPages: number = Math.max(1, Math.ceil(totalItems / productsPerPage))
  const paginatedProducts = filteredAndSortedProducts

  // Limit pagination buttons to avoid rendering thousands of elements (can freeze the UI)
  const MAX_PAGINATION_BUTTONS: number = 9
  type PageWindowArgs = Readonly<{ currentPage: number; totalPages: number; maxButtons: number }>
  const getPageWindow = ({ currentPage, totalPages, maxButtons }: PageWindowArgs): number[] => {
    const cap = Math.max(1, Math.min(maxButtons, 25))
    if (totalPages <= cap) return Array.from({ length: totalPages }, (_, i) => i + 1)
    const half = Math.floor(cap / 2)
    let start = Math.max(1, currentPage - half)
    const end = Math.min(totalPages, start + cap - 1)
    if (end - start + 1 < cap) start = Math.max(1, end - cap + 1)
    return Array.from({ length: end - start + 1 }, (_, i) => start + i)
  }
  const pageWindow: readonly number[] = getPageWindow({
    currentPage,
    totalPages,
    maxButtons: MAX_PAGINATION_BUTTONS,
  })

  if (isDisabled) {
    return (
      <div className="container mx-auto px-4 py-12 text-center text-muted-foreground">
        <h1 className="text-3xl font-bold mb-2">Products Disabled</h1>
        <p>Product listing is turned off in safe mode.</p>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Shop All Products</h1>
        {isLoading && <p className="text-muted-foreground">Loading products…</p>}
        {error && !isLoading && <p className="text-red-600">Failed to load products.</p>}
        {!isLoading && !error && (
          <p className="text-muted-foreground">
            Showing {paginatedProducts.length} results • Page {currentPage} of {totalPages}
          </p>
        )}
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        <aside className="hidden lg:block w-64 shrink-0">
          <div className="sticky top-24">
            <ProductFilters filters={filters} onFiltersChange={setFilters} />
          </div>
        </aside>

        <div className="flex-1">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between mb-6 gap-2 sm:gap-4">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" className="lg:hidden bg-transparent w-full sm:w-auto">
                  <Filter className="h-4 w-4 mr-2" />
                  Filters
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[85vw] sm:w-80">
                <div className="mt-6">
                  <ProductFilters filters={filters} onFiltersChange={setFilters} />
                </div>
              </SheetContent>
            </Sheet>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
              <SlidersHorizontal className="h-4 w-4" />
              <label htmlFor={sortSelectId} className="sr-only">Sort products</label>
              <Select
                value={sortBy}
                onValueChange={(v) => {
                  setSortBy(v)
                  setCurrentPage(1)
                  updateUrl({ sort: v, page: 1 })
                }}
              >
                <SelectTrigger id={sortSelectId} aria-label="Sort products" title="Sort products" className="w-full sm:w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {sortOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {!isLoading && !error ? (
            paginatedProducts.length > 0 ? (
              <ProductGrid
                products={paginatedProducts}
                priorityFirst={currentPage === 1 && (serverCategory ?? "") === "" && apiSort === "newest"}
              />
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground">
                <p className="mb-4">No products found. Try adjusting filters or sorting.</p>
                <Button
                  variant="outline"
                  onClick={() => {
                    setFilters({ categories: [], priceRange: [0, 500], inStock: undefined })
                    setSortBy("newest")
                    setCurrentPage(1)
                    updateUrl({ sort: "newest", page: 1 })
                  }}
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

          {totalPages > 1 && !isLoading && !error && (
            <div className="flex flex-wrap justify-center items-center gap-2 mt-12">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const next = Math.max(1, currentPage - 1)
                  setCurrentPage(next)
                  updateUrl({ page: next })
                }}
                disabled={currentPage === 1}
              >
                Previous
              </Button>

              <div className="flex gap-1 overflow-x-auto px-1">
                {pageWindow.map((page) => (
                  <Button
                    key={page}
                    variant={currentPage === page ? "default" : "outline"}
                    size="sm"
                    className="min-w-9"
                    onClick={() => {
                      setCurrentPage(page)
                      updateUrl({ page })
                    }}
                  >
                    {page}
                  </Button>
                ))}
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const next = Math.min(totalPages, currentPage + 1)
                  setCurrentPage(next)
                  updateUrl({ page: next })
                }}
                disabled={currentPage === totalPages}
              >
                Next
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
