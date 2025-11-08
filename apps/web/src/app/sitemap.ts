import type { MetadataRoute } from "next"

const BASE: string = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"
export const dynamic = "force-dynamic"
const FETCH_TIMEOUT_MS: number = 3000
const RAW_ENV: string = process.env.NODE_ENV ?? "development"
const DISABLE_FETCH: boolean =
  RAW_ENV === "production"
    ? false
    : (process.env.NEXT_PUBLIC_DISABLE_DATA_FETCH ?? "false") === "true"

const baseRoutes: readonly string[] = ["/", "/shop", "/categories", "/contact"] as const

type ServerCategoryDto = Readonly<{
  id: string
  slug: string
  name: string
}>

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now: Date = new Date()
  const items: MetadataRoute.Sitemap = []

  // Core routes with language alternates
  for (const route of baseRoutes) {
    const urlEn: string = new URL(route, BASE).toString()
    const urlEs: string = new URL(route === "/" ? "/es" : `/es${route}`, BASE).toString()
    items.push({
      url: urlEn,
      lastModified: now,
      changeFrequency: "weekly",
      alternates: { languages: { en: urlEn, es: urlEs } },
    })
  }

  // Categories from API (non-blocking, fast timeout)
  if (!DISABLE_FETCH) {
    try {
      const controller: AbortController = new AbortController()
      const timer: NodeJS.Timeout = setTimeout((): void => controller.abort(), FETCH_TIMEOUT_MS)
      const res: Response = await fetch(new URL("/api/v1/categories", BASE).toString(), {
        next: { revalidate: 60 },
        signal: controller.signal,
      })
      clearTimeout(timer)
      if (res.ok) {
        const json: Readonly<{ items: readonly ServerCategoryDto[] }> =
          (await res.json()) as Readonly<{
            items: readonly ServerCategoryDto[]
          }>
        for (const c of json.items ?? []) {
          const path: string = `/categories/${encodeURIComponent(c.slug)}`
          const urlEn: string = new URL(path, BASE).toString()
          const urlEs: string = new URL(`/es${path}`, BASE).toString()
          items.push({
            url: urlEn,
            lastModified: now,
            changeFrequency: "weekly",
            alternates: { languages: { en: urlEn, es: urlEs } },
          })
        }
      }
    } catch {
      // ignore slow/failed fetch and ship base routes only
    }
  }

  return items
}
