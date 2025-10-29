import type { JSX } from "react"
import type { Metadata } from "next"
import Image from "next/image"
import { productsDisabled } from "@/lib/safe-mode"
import ShopPageClient from "./client"
import { productsRepo } from "@repo/db"
import type { ListProductsResponse } from "@/lib/data/products"
import { unstable_cache } from "next/cache"

export const revalidate = 60
// Avoid build-time DB requirement in CI by disabling SSG for this route.
export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Shop All Products",
  alternates: { canonical: "/shop" },
}

/**
 * Server wrapper for the Shop page. In safe mode, render a static placeholder
 * and avoid importing any heavy client logic. Otherwise, render the client page.
 */
export default async function ShopPage({
  searchParams: _searchParams,
}: {
  readonly searchParams: Record<string, string | string[] | undefined>
}): Promise<JSX.Element> {
  if (productsDisabled) {
    return (
      <div className="container mx-auto px-4 py-12 text-center text-muted-foreground">
        <h1 className="text-3xl font-bold mb-2">Products Disabled</h1>
        <p>Product listing is turned off in safe mode.</p>
      </div>
    )
  }
  // Server-side prefetch of first page to avoid blank client boot and API cold start.
  // Keep the page size in sync with the client constant (12).
  const pageSize = 12
  const page = 1
  const sort = "newest" as const
  type RepoListResult = Readonly<{
    items: ReadonlyArray<
      Readonly<{
        id: string
        slug: string
        name?: string
        price: number
        imageUrl?: string
        description?: string
        categorySlug?: string
        kind?: "digital" | "physical"
        digitalVersion?: string
      }>
    >
    total: number
    page: number
    pageSize: number
  }>

  const getInitialList = unstable_cache(
    async (): Promise<RepoListResult> => {
      const res = await productsRepo.list({ page, pageSize, sort })
      return res as RepoListResult
    },
    ["shop-initial-list", String(pageSize), sort],
    { revalidate: 60, tags: ["products:list:default"] },
  )
  const result = await getInitialList()
  // Map server DTO (cents) to UI Product dollars minimal shape
  const items = result.items.map((dto) => ({
    id: dto.id,
    name: dto.name ?? dto.slug,
    price: Math.round(dto.price) / 100,
    originalPrice: undefined,
    description: dto.description ?? "Product description coming soon.",
    images: dto.imageUrl ? [dto.imageUrl] : ["/placeholder.svg"],
    category:
      (dto.categorySlug?.trim().replaceAll("-", " ").replace(/\b\w/g, (m) => m.toUpperCase())) ??
      "General",
    slug: dto.slug,
    inStock: true,
    rating: 4.5,
    reviewCount: 0,
    tags: [],
    kind: dto.kind,
    digital: dto.kind === "digital" ? { version: dto.digitalVersion } : undefined,
  }))
  const initialData: ListProductsResponse = {
    items,
    total: result.total,
    page: result.page,
    pageSize: result.pageSize,
  }
  const firstImage: string | undefined = items[0]?.images?.[0]
  return (
    <>
      {firstImage ? (
        <Image
          src={firstImage}
          alt=""
          priority
          fetchPriority="high"
          width={1}
          height={1}
          sizes="(min-width: 1280px) 25vw, (min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
          style={{ position: "absolute", width: 1, height: 1, opacity: 0, pointerEvents: "none" }}
        />
      ) : null}
      <ShopPageClient initialData={initialData} />
    </>
  )
}
