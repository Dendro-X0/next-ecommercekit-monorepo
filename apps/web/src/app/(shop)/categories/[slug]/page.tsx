import { unstable_cache } from "next/cache"
import Image from "next/image"
import type { JSX } from "react"
import { productsDisabled } from "@/lib/safe-mode"
import { productsRepo } from "@repo/db"
import type { Product } from "@/types"
import { env } from "~/env"

export const revalidate = 60

export default async function CategoryPage({
  params,
}: {
  params: { slug: string }
}): Promise<JSX.Element> {
  if (productsDisabled) {
    return (
      <div className="container mx-auto px-4 py-12 text-center text-muted-foreground">
        <h1 className="text-3xl font-bold mb-2">Products Disabled</h1>
        <p>Category product listing is turned off in safe mode.</p>
      </div>
    )
  }
  // Minimal JSON-LD for Category collection page
  const base: string = (() => {
    const v = env.NEXT_PUBLIC_APP_URL
    if (typeof v === "string" && v.length > 0) return v
    return "http://localhost:3000"
  })()
  const url = `${base}/categories/${encodeURIComponent(params.slug)}`
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: `Category: ${params.slug}`,
    url,
  } as const
  const pageSize: number = 24
  const slug = params.slug
  const getCategoryProducts = unstable_cache(
    async (): Promise<{
      items: readonly Product[]
      total: number
      page: number
      pageSize: number
    }> => {
      const res = await productsRepo.list({ category: slug, page: 1, pageSize, sort: "newest" })
      const items: readonly Product[] = res.items.map((dto) => ({
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
      return { items, total: res.total, page: res.page, pageSize: res.pageSize }
    },
    ["cat:list", slug, "p1", "s-newest", `ps${pageSize}`],
    { revalidate: 60, tags: ["products:list:category", `category:${slug}`] },
  )

  const initialData = await getCategoryProducts()
  const { default: CategoryPageClient } = await import("./client")
  return (
    <>
      <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      {initialData.items?.[0]?.images?.[0] ? (
        <Image
          src={initialData.items[0].images[0]}
          alt=""
          priority
          fetchPriority="high"
          width={1}
          height={1}
          sizes="(min-width: 1280px) 25vw, (min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
          style={{ position: "absolute", width: 1, height: 1, opacity: 0, pointerEvents: "none" }}
        />
      ) : null}
      <CategoryPageClient params={params} initialData={initialData} />
    </>
  )
}
