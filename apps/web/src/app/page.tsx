import { MinimalLangHeader } from "modules/shared/components/minimal-lang-header"
import type { JSX } from "react"
import { ShopHome } from "@/components/home/ShopHome"
import { Footer } from "@/components/layout/footer"
import { Header } from "@/components/layout/header"
import { ClientIslands } from "./client-islands"

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
  return (
    <div className="min-h-screen flex flex-col">
      {enableMinimalLangHeader && <MinimalLangHeader />}
      <Header />
      <div className="flex-1">
        <ClientIslands
          enableAffiliate={!disableAffiliate}
          enableCartHydrator={!disableCartHydrator}
          enableToaster={!disableToaster}
        />
        <ShopHome />
      </div>
      <Footer />
    </div>
  )
}
