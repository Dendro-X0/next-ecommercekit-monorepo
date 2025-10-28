/**
 * Custom Next.js Image loader.
 * - If S3_PUBLIC_BASE_URL is set and src is relative, prefixes it to form a CDN URL.
 * - If src is absolute (http/https), returns as-is.
 * - Optionally appends width/quality query params for CDNs that honor them.
 */
export type ImageLoaderProps = Readonly<{
  src: string
  width: number
  quality?: number
}>

function isAbsolute(url: string): boolean {
  return /^https?:\/\//i.test(url)
}

export default function imageLoader({ src, width, quality }: ImageLoaderProps): string {
  const base = process.env.S3_PUBLIC_BASE_URL
  const q = typeof quality === "number" && quality > 0 ? quality : 75
  if (isAbsolute(src)) {
    const u = new URL(src)
    u.searchParams.set("w", String(width))
    u.searchParams.set("q", String(q))
    return u.toString()
  }
  const path = src.startsWith("/") ? src.slice(1) : src
  if (base) {
    const u = new URL(base)
    // Append path to base
    const joined = `${u.toString().replace(/\/$/, "")}/${path}`
    const out = new URL(joined)
    out.searchParams.set("w", String(width))
    out.searchParams.set("q", String(q))
    return out.toString()
  }
  // Fallback: relative path under Next public/ or remotePatterns allowlist
  const rel = new URL(`http://local/${path}`)
  rel.searchParams.set("w", String(width))
  rel.searchParams.set("q", String(q))
  return `${rel.pathname}?${rel.searchParams.toString()}`
}
