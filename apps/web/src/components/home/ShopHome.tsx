import type { JSX } from "react"
import dynamic from "next/dynamic"
import { FeaturedProducts as FeaturedProductsSSR } from "@/components/home/FeaturedProducts"
import { TopSelling as TopSellingSSR } from "@/components/home/TopSelling"
import { unstable_cache } from "next/cache"
import { HeroSection } from "@/components/home/HeroSection"
import { productsRepo } from "@repo/db"
import type { Product } from "@/types"

// Keep below-the-fold sections client-only; SSR the first product sections to avoid CLS.
const BrowseCategoriesLazy = dynamic(
  () => import("@/components/home/BrowseCategories").then((m) => m.BrowseCategories),
  {
    ssr: false,
    loading: () => (
      <section className="py-16" style={{ contentVisibility: "auto", containIntrinsicSize: "1200px 700px" }} />
    ),
  },
)
const CustomerTestimonialsLazy = dynamic(
  () => import("@/components/home/CustomerTestimonials").then((m) => m.CustomerTestimonials),
  {
    ssr: false,
    loading: () => (
      <section className="py-16" style={{ contentVisibility: "auto", containIntrinsicSize: "1200px 600px" }} />
    ),
  },
)
const NewsletterSignupLazy = dynamic(
  () => import("@/components/home/NewsletterSignup").then((m) => m.NewsletterSignup),
  {
    ssr: false,
    loading: () => (
      <section className="py-16" style={{ contentVisibility: "auto", containIntrinsicSize: "1200px 400px" }} />
    ),
  },
)

/**
 * ShopHome renders the main storefront sections used on the shop landing page.
 * Extracted to avoid cross-route imports between `app/page.tsx` and `app/(shop)/page.tsx`.
 */
export async function ShopHome(): Promise<JSX.Element> {
  // Cache small home payloads briefly to cut cold-starts and first paint.
  const getFeatured = unstable_cache(
    async (): Promise<readonly Product[]> => {
      const dtos = await productsRepo.listFeatured(4)
      const items: readonly Product[] = dtos.map((dto) => ({
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
      return items
    },
    ["home-featured", "4"],
    { revalidate: 60, tags: ["products:featured:4"] },
  )

  const getTopSelling = unstable_cache(
    async (): Promise<readonly Product[]> => {
      const res = await productsRepo.list({ page: 1, pageSize: 12, sort: "newest" })
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
      return items
    },
    ["home-top-selling", "p1", "s-newest", "ps12"],
    { revalidate: 60, tags: ["products:list:home"] },
  )

  const [featuredItems, topItems] = await Promise.all([getFeatured(), getTopSelling()])

  return (
    <main>
      <HeroSection />
      <FeaturedProductsSSR initialData={{ items: featuredItems }} />
      <TopSellingSSR initialData={{ items: topItems }} />
      <BrowseCategoriesLazy />
      <CustomerTestimonialsLazy />
      <NewsletterSignupLazy />
    </main>
  )
}
