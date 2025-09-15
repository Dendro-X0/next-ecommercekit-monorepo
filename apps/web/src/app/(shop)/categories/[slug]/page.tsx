import { headers } from "next/headers"
import type { JSX } from "react"
import { productsDisabled } from "@/lib/safe-mode"

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
  const h = await headers()
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000"
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https")
  const base = `${proto}://${host}`
  const url = `${base}/categories/${encodeURIComponent(params.slug)}`
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: `Category: ${params.slug}`,
    url,
  } as const
  const { default: CategoryPageClient } = await import("./client")
  return (
    <>
      <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      <CategoryPageClient params={params} />
    </>
  )
}
