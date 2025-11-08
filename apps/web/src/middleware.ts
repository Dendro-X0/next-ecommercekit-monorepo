import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"
import { LOCALES_CONFIG } from "@/modules/shared/config/locales"

/**
 * Middleware: capture ?ref=CODE and set AFF_REF cookie for 30 days.
 * One export per file: default function.
 */
export function middleware(req: NextRequest): NextResponse {
  const url: URL = req.nextUrl.clone()
  const ref: string | null = url.searchParams.get("ref")
  const isProd: boolean = (process.env.NODE_ENV ?? "development") === "production"

  // Locale prefix rewrite: allow any enabled locale prefix without duplicating routes.
  const firstSeg: string = url.pathname.split("/")[1] ?? ""
  const enabledCodes: readonly string[] = LOCALES_CONFIG.options
    .filter((o) => o.enabled)
    .map((o) => o.code)
  if (enabledCodes.includes(firstSeg)) {
    const dest = req.nextUrl.clone()
    const re = new RegExp(`^/(?:${enabledCodes.join("|")})(?=/|$)`) // strip first locale segment
    dest.pathname = url.pathname.replace(re, "") || "/"
    const rewriteRes: NextResponse = NextResponse.rewrite(dest)
    if (ref && ref.length >= 4) {
      rewriteRes.cookies.set({
        name: "AFF_REF",
        value: ref,
        path: "/",
        sameSite: "lax",
        secure: isProd,
        maxAge: 60 * 60 * 24 * 30,
      })
    }
    return rewriteRes
  }

  const res: NextResponse = NextResponse.next()
  if (ref && ref.length >= 4) {
    res.cookies.set({
      name: "AFF_REF",
      value: ref,
      path: "/",
      sameSite: "lax",
      secure: isProd,
      maxAge: 60 * 60 * 24 * 30,
    })
  }
  return res
}

// Avoid running on static assets, images, API routes, and well-known files
export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|.well-known|api).*)"],
}
