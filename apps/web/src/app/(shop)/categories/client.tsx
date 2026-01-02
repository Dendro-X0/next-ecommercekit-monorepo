"use client"

import { useQuery } from "@tanstack/react-query"
import type { JSX } from "react"
import { useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { SafeImage } from "@/components/ui/safe-image"
import { Skeleton } from "@/components/ui/skeleton"
import { categoriesApi } from "@/lib/data/categories"
import { productsDisabled } from "@/lib/safe-mode"
import type { Category } from "@/types"
import { AppLink } from "../../../../modules/shared/components/app-link"

/**
 * Categories index page: lists all categories from the backend.
 */
type CategoriesPageClientProps = Readonly<{
  initialData?: Readonly<{ items: readonly Category[] }>
}>

export default function CategoriesPageClient({
  initialData,
}: CategoriesPageClientProps): JSX.Element {
  const isDisabled: boolean = productsDisabled
  const { data, isLoading, error } = useQuery<{ items: readonly Category[] }>({
    queryKey: ["categories"],
    queryFn: () => categoriesApi.list(),
    enabled: !isDisabled,
    staleTime: 5 * 60_000,
    initialData,
  })

  const items: readonly Category[] = data?.items ?? []

  // Stable keys for loading skeletons (10 placeholders)
  const skeletonKeys: readonly string[] = useMemo(
    () => Array.from({ length: 10 }, (_v, i) => `categories-skel-${i}`),
    [],
  )

  if (isDisabled) {
    return (
      <div className="container mx-auto px-4 py-8 text-center text-muted-foreground">
        <h1 className="text-3xl font-bold mb-2">Categories</h1>
        <p>Category listings are disabled in safe mode.</p>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Categories</h1>
        {error && <p className="text-sm text-destructive">Failed to load categories.</p>}
        {!error && (
          <p className="text-muted-foreground">Browse categories and discover products.</p>
        )}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
          {skeletonKeys.map((k) => (
            <div key={k} className="space-y-3">
              <div className="aspect-square rounded-lg overflow-hidden">
                <Skeleton className="h-full w-full" />
              </div>
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
          {items.map((c, idx) => (
            <AppLink key={c.id} href={`/categories/${c.slug}`} className="group">
              <Card className="h-full overflow-hidden">
                <CardHeader className="p-0">
                  <div className="aspect-square w-full overflow-hidden relative">
                    <SafeImage
                      src={`/categories/${c.slug}.jpg`}
                      fallbackSrc={`${c.image || "/placeholder.svg"}?height=300&width=300`}
                      alt={c.name}
                      fill
                      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                      priority={idx === 0}
                      fetchPriority={idx === 0 ? "high" : "low"}
                      className="object-cover transition-transform duration-200 group-hover:scale-105"
                    />
                  </div>
                </CardHeader>
                <CardContent className="pt-4">
                  <CardTitle className="text-base">{c.name}</CardTitle>
                  <p className="text-sm text-muted-foreground">{c.productCount} products</p>
                </CardContent>
              </Card>
            </AppLink>
          ))}
        </div>
      )}
    </div>
  )
}
