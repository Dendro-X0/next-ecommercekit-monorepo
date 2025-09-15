import { headers } from "next/headers"
import type { JSX } from "react"
import { productsDisabled } from "@/lib/safe-mode"

export default async function ProductPage({
  params,
}: {
  params: { slug: string }
}): Promise<JSX.Element> {
  if (productsDisabled) {
    return (
      <div className="container mx-auto px-4 py-24 text-center">
        <h1 className="text-2xl font-semibold">Products Disabled</h1>
        <p className="text-muted-foreground mt-2">PDP is turned off in safe mode.</p>
      </div>
    )
  }
  // Server fetch to build JSON-LD for PDP
  const h = await headers()
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000"
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https")
  const base = `${proto}://${host}`
  let jsonLd: Record<string, unknown> | null = null
  try {
    const res: Response = await fetch(
      `${base}/api/v1/products/${encodeURIComponent(params.slug)}`,
      { cache: "no-store" },
    )
    if (res.ok) {
      const dto = (await res.json()) as Readonly<{
        id: string
        slug: string
        name: string
        price: number // cents
        currency: "USD"
        imageUrl?: string
        description?: string
        media?: ReadonlyArray<Readonly<{ url: string; kind: "image" | "video" }>>
      }>
      const images = (dto.media ?? []).filter((m) => m.kind === "image").map((m) => m.url)
      const imageList = images.length > 0 ? images : dto.imageUrl ? [dto.imageUrl] : []
      jsonLd = {
        "@context": "https://schema.org",
        "@type": "Product",
        name: dto.name || dto.slug,
        image: imageList,
        description: dto.description ?? undefined,
        sku: dto.id,
        offers: {
          "@type": "Offer",
          priceCurrency: dto.currency,
          price: (Math.round(dto.price) / 100).toFixed(2),
          url: `${base}/products/${encodeURIComponent(dto.slug)}`,
          availability: "https://schema.org/InStock",
        },
      }
    }
  } catch {
    // ignore JSON-LD if fetch fails
  }
  const { default: ProductPageClient } = await import("./client")
  return (
    <>
      {jsonLd && <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>}
      <ProductPageClient />
    </>
  )
}
