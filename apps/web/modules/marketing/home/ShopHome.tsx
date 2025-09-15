import type { JSX } from "react"
import { BrowseCategories } from "./BrowseCategories"
import { CustomerTestimonials } from "./CustomerTestimonials"
import { FeaturedProducts } from "./FeaturedProducts"
import { HeroSection } from "./HeroSection"
import { NewsletterSignup } from "./NewsletterSignup"
import { TopSelling } from "./TopSelling"

/**
 * ShopHome renders the main storefront sections used on the shop landing page.
 * Extracted to avoid cross-route imports between `app/page.tsx` and `app/(shop)/page.tsx`.
 */
export function ShopHome(): JSX.Element {
  // Granular gates to isolate potential hydration or rendering issues in production.
  const disableHero: boolean =
    (process.env.NEXT_PUBLIC_DISABLE_HERO ?? "false").toLowerCase() === "true"
  const disableFeatured: boolean =
    (process.env.NEXT_PUBLIC_DISABLE_FEATURED ?? "false").toLowerCase() === "true"
  const disableTopSelling: boolean =
    (process.env.NEXT_PUBLIC_DISABLE_TOP_SELLING ?? "false").toLowerCase() === "true"
  const disableBrowseCategories: boolean =
    (process.env.NEXT_PUBLIC_DISABLE_BROWSE_CATEGORIES ?? "false").toLowerCase() === "true"
  const disableTestimonials: boolean =
    (process.env.NEXT_PUBLIC_DISABLE_TESTIMONIALS ?? "false").toLowerCase() === "true"
  const disableNewsletter: boolean =
    (process.env.NEXT_PUBLIC_DISABLE_NEWSLETTER ?? "false").toLowerCase() === "true"
  return (
    <main>
      {!disableHero && <HeroSection />}
      {!disableFeatured && <FeaturedProducts />}
      {!disableTopSelling && <TopSelling />}
      {!disableBrowseCategories && <BrowseCategories />}
      {!disableTestimonials && <CustomerTestimonials />}
      {!disableNewsletter && <NewsletterSignup />}
    </main>
  )
}
