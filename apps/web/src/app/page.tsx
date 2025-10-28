import { MinimalLangHeader } from "modules/shared/components/minimal-lang-header"
import type { JSX } from "react"
import { ShopHome } from "@/components/home/ShopHome"
import { Footer } from "@/components/layout/footer"
import { Header } from "@/components/layout/header"
import { ClientIslands } from "./client-islands"
export const revalidate = 60

/**
 * Production homepage: render full storefront UI.
 * Safe mode removed to avoid divergent builds and bundling differences.
 */
export default function LandingPage(): JSX.Element {
  const disableToaster: boolean =
    (process.env.NEXT_PUBLIC_DISABLE_TOASTER ?? "false").toLowerCase() === "true"
  const disableCartHydrator: boolean =
    (process.env.NEXT_PUBLIC_DISABLE_CART_HYDRATOR ?? "false").toLowerCase() === "true"
  const disableAffiliate: boolean =
    (process.env.NEXT_PUBLIC_DISABLE_AFFILIATE_TRACKER ?? "false").toLowerCase() === "true"
  const enableMinimalLangHeader: boolean =
    (process.env.NEXT_PUBLIC_ENABLE_MINIMAL_LANG_HEADER ?? "false").toLowerCase() === "true"
  const baseUrl: string = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
  return (
    <div className="min-h-screen flex flex-col">
      {/* JSON-LD for WebSite and Organization */}
      <script type="application/ld+json" suppressHydrationWarning>
        {JSON.stringify({
          "@context": "https://schema.org",
          "@type": "WebSite",
          url: baseUrl,
          name: "ModularShop",
          potentialAction: {
            "@type": "SearchAction",
            target: `${baseUrl}/search?q={search_term_string}`,
            "query-input": "required name=search_term_string",
          },
        })}
      </script>
      <script type="application/ld+json" suppressHydrationWarning>
        {JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Organization",
          name: "ModularShop",
          url: baseUrl,
          logo: `${baseUrl}/next-ecommerce-starter.png`,
        })}
      </script>
      {enableMinimalLangHeader && <MinimalLangHeader />}
      <Header />
      <div className="flex-1">
        <ShopHome />
        {/* Mount client islands after main content to minimize CLS and protect LCP */}
        <ClientIslands
          enableAffiliate={!disableAffiliate}
          enableCartHydrator={!disableCartHydrator}
          enableToaster={!disableToaster}
        />
      </div>
      <Footer />
    </div>
  )
}
