import { getLocaleFromHeaders } from "modules/shared/lib/i18n/config"
import { formatCurrency } from "modules/shared/lib/i18n/format"
import { headers } from "next/headers"
import Image from "next/image"
import type { JSX } from "react"

/**
 * Minimal SSR fallback for the Shop page.
 * Radical strategy: render a simple, server-rendered product list without client hydration.
 * - No client filters, no wishlist checks, no React Query.
 * - Uses a tiny server-side mapper to extract display fields from the API DTO.
 * - Paginates by query params (?page, ?pageSize, ?sort, ?category) but renders a simple pager.
 *
 * This isolates any client-side render loops and guarantees responsiveness.
 */

// Server DTO (subset)
type ServerProductDto = Readonly<{
  id: string
  slug: string
  name: string
  price: number // cents
  currency: "USD"
  imageUrl?: string
  description?: string
  categorySlug?: string
  featured?: boolean
  media?: ReadonlyArray<Readonly<{ url: string; kind: "image" | "video" }>>
}>

// Response shape
type ServerListResponse = Readonly<{
  items: readonly ServerProductDto[]
  total: number
  page: number
  pageSize: number
}>

// Display model
type DisplayProduct = Readonly<{
  id: string
  slug: string
  name: string
  price: number
  image: string
}>

const centsToDollars = (cents: number): number => Math.round(cents) / 100

function mapToDisplay(dto: ServerProductDto): DisplayProduct {
  const mediaImg = (dto.media ?? []).find((m) => m.kind === "image")?.url
  const image = mediaImg || dto.imageUrl || "/placeholder.svg"
  return {
    id: dto.id,
    slug: dto.slug,
    name: dto.name || dto.slug,
    price: centsToDollars(dto.price),
    image,
  }
}

function readParamInt(str: string | null, fallback: number, max: number): number {
  const n = Number(str)
  if (!Number.isFinite(n)) return fallback
  const clamped = Math.max(1, Math.min(max, Math.trunc(n)))
  return clamped
}

export default async function ShopPageServer({
  searchParams,
}: {
  readonly searchParams:
    | Promise<Record<string, string | string[] | undefined>>
    | Record<string, string | string[] | undefined>
}): Promise<JSX.Element> {
  const isPromiseLike = <T,>(v: unknown): v is PromiseLike<T> =>
    typeof v === "object" &&
    v !== null &&
    "then" in (v as Record<string, unknown>) &&
    typeof (v as PromiseLike<T>).then === "function"
  const spResolved: Record<string, string | string[] | undefined> = isPromiseLike<
    Record<string, string | string[] | undefined>
  >(searchParams)
    ? await searchParams
    : searchParams
  const sp = new URLSearchParams()
  for (const [k, v] of Object.entries(spResolved ?? {})) {
    if (Array.isArray(v)) {
      for (const vv of v) sp.append(k, String(vv))
    } else if (typeof v === "string") {
      sp.set(k, v)
    }
  }
  const page = readParamInt(sp.get("page"), 1, 10_000)
  const pageSize = readParamInt(sp.get("pageSize"), 12, 100)
  const sort = (sp.get("sort") ?? "newest").toString()
  const category = sp.get("category") ?? undefined

  const usp = new URLSearchParams()
  usp.set("page", String(page))
  usp.set("pageSize", String(pageSize))
  usp.set("sort", sort)
  if (category) usp.set("category", category)

  // Compute base URL from incoming request headers for server-side fetch
  const h = await headers()
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000"
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https")
  const base = `${proto}://${host}`
  const res = await fetch(`${base}/api/v1/products?${usp.toString()}`, {
    cache: "no-store",
    // No credentials on server-side internal call; cookies are attached automatically when needed
  })
  if (!res.ok) {
    return (
      <div className="container mx-auto px-4 py-12 text-center text-muted-foreground">
        <h1 className="text-3xl font-bold mb-2">Shop</h1>
        <p>Failed to load products. Try again later.</p>
      </div>
    )
  }
  const data = (await res.json()) as ServerListResponse
  const items: readonly DisplayProduct[] = (data.items ?? []).map(mapToDisplay)
  const total = data.total ?? 0
  const totalPages = Math.max(1, Math.ceil(total / pageSize))

  const windowPages = (() => {
    const cap = 9
    if (totalPages <= cap) return Array.from({ length: totalPages }, (_, i) => i + 1)
    const half = Math.floor(cap / 2)
    let start = Math.max(1, page - half)
    const end = Math.min(totalPages, start + cap - 1)
    if (end - start + 1 < cap) start = Math.max(1, end - cap + 1)
    return Array.from({ length: end - start + 1 }, (_, i) => start + i)
  })()

  const locale = getLocaleFromHeaders(h)
  const formatPrice = (n: number): string => formatCurrency(locale, n)

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Shop All Products</h1>
        <p className="text-muted-foreground">
          Server-rendered fallback • Page {page} of {totalPages}
        </p>
      </div>

      {items.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">No products found.</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
          {items.map((p) => (
            <a
              key={p.id}
              href={`/products/${encodeURIComponent(p.slug)}`}
              className="group relative bg-card rounded-lg border p-4 transition-all hover:shadow-lg"
            >
              <div className="relative aspect-square overflow-hidden rounded-md bg-muted">
                <Image
                  src={p.image}
                  alt={p.name}
                  fill
                  priority={false}
                  sizes="(min-width: 1280px) 25vw, (min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                  className="object-cover transition-all group-hover:scale-105"
                />
              </div>
              <div className="mt-3 space-y-1">
                <div className="font-medium truncate" title={p.name}>
                  {p.name}
                </div>
                <div className="text-sm text-muted-foreground">{formatPrice(p.price)}</div>
              </div>
            </a>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex flex-wrap justify-center items-center gap-2 mt-12">
          {windowPages.map((pg) => {
            const s = new URLSearchParams(usp)
            s.set("page", String(pg))
            return (
              <a
                key={pg}
                href={`/shop?${s.toString()}`}
                className={`min-w-9 px-3 py-1 rounded border ${pg === page ? "bg-black text-white border-black" : "bg-transparent"}`}
              >
                {pg}
              </a>
            )
          })}
        </div>
      )}
    </div>
  )
}
