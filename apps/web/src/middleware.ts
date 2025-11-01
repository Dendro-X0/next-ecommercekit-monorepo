import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"

/**
 * Middleware: capture ?ref=CODE and set AFF_REF cookie for 30 days.
 * One export per file: default function.
 */
export function middleware(req: NextRequest): NextResponse {
  const url: URL = req.nextUrl.clone()
  const ref: string | null = url.searchParams.get("ref")
  const isProd: boolean = (process.env.NODE_ENV ?? "development") === "production"

  // Locale prefix rewrite: allow /en/* and /es/* without duplicating routes.
  const firstSeg: string = url.pathname.split("/")[1] ?? ""
  if (firstSeg === "en" || firstSeg === "es") {
    const dest = req.nextUrl.clone()
    dest.pathname = url.pathname.replace(/^\/(en|es)(?=\/|$)/, "") || "/"
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
