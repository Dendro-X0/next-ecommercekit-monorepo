import type { JSX } from "react"
import { productsDisabled } from "@/lib/safe-mode"
import ShopPageClient from "./client"

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
  // Full client experience
  return <ShopPageClient />
}
