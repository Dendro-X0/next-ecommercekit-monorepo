import { request } from "@playwright/test"

export type CrawlTarget = Readonly<{
  url: string
}>

export async function fetchSitemapUrls(baseUrl: string): Promise<string[]> {
  const ctx = await request.newContext()
  const res = await ctx.get(new URL("/sitemap.xml", baseUrl).toString(), { timeout: 20000 })
  if (!res.ok()) return []
  const xml = await res.text()
  await ctx.dispose()
  const urls = parseSitemap(xml)
  return rebaseUrls(urls, baseUrl)
}

export function parseSitemap(xml: string): string[] {
  const urls: string[] = []
  const re = /<loc>([^<]+)<\/loc>/g
  let m: RegExpExecArray | null
  while ((m = re.exec(xml)) !== null) {
    const loc = m[1].trim()
    if (loc) urls.push(loc)
  }
  return Array.from(new Set(urls))
}

function rebaseUrls(urls: string[], baseUrl: string): string[] {
  const base = new URL(baseUrl)
  return urls.map((u) => {
    try {
      const parsed = new URL(u)
      parsed.protocol = base.protocol
      parsed.host = base.host
      return parsed.toString()
    } catch {
      // Relative path in sitemap
      return new URL(u, base).toString()
    }
  })
}
