import { app } from "@repo/api"
import { handle } from "hono/vercel"

export const runtime = "nodejs"

type NextHandler = (req: Request) => Promise<Response>
const anyHandle = handle as unknown as (h: unknown) => NextHandler
const handler: NextHandler = anyHandle(app as unknown)

// Wrap GET to attach minimal caching headers to safe, read-only public endpoints
export async function GET(req: Request): Promise<Response> {
  const res = await handler(req)
  try {
    const url = new URL(req.url)
    const pathname = url.pathname
    const isPublicProducts =
      pathname === "/api/v1/products" ||
      pathname === "/api/v1/products/featured" ||
      pathname === "/api/v1/categories"
    if (isPublicProducts && res.ok) {
      const clone = new Response(res.body, res)
      clone.headers.set(
        "Cache-Control",
        "public, max-age=0, s-maxage=60, stale-while-revalidate=300",
      )
      // Conservative vary to avoid mixing locales/encodings; do not vary on cookies to allow CDNs to cache
      clone.headers.append("Vary", "Accept-Encoding")
      clone.headers.append("Vary", "Accept-Language")
      return clone
    }
  } catch {
    // noop – fall through to original response
  }
  return res
}
export const POST = handler
export const PATCH = handler
export const PUT = handler
export const DELETE = handler
export const OPTIONS = handler
export const HEAD = handler
