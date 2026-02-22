import type { CatalogAdapter } from "./adapter"
import type { CatalogProvider } from "./types"
import { createMedusaAdapter } from "./providers/medusa"
import { createNativeAdapter } from "./providers/native"
import { createShopifyAdapter } from "./providers/shopify"

let singleton: CatalogAdapter | null = null

export function getCatalogProvider(): CatalogProvider {
  const raw = (process.env.CATALOG_PROVIDER ?? "native").trim().toLowerCase()
  if (raw === "shopify" || raw === "medusa" || raw === "native") return raw
  return "native"
}

export function getCatalogAdapter(): CatalogAdapter {
  if (singleton) return singleton
  const provider = getCatalogProvider()
  if (provider === "shopify") singleton = createShopifyAdapter()
  else if (provider === "medusa") singleton = createMedusaAdapter()
  else singleton = createNativeAdapter()
  return singleton
}
