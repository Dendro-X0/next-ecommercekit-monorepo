import { auth } from "@repo/auth"
import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"
import { LOCALES_CONFIG } from "@/modules/shared/config/locales"

/**
 * Next.js 16 proxy entrypoint for request handling.
 *
 * - Handles locale-prefixed paths and rewrites them to non-locale routes.
 * - Captures ?ref=CODE and sets AFF_REF cookies.
 * - Gates /dashboard routes behind auth and redirects unauthenticated users
 *   to /auth/login with a callbackUrl.
 */
const DASHBOARD_PREFIX = "/dashboard" as const
const LOGIN_ROUTE = "/auth/login" as const
const AFF_COOKIE_NAME = "AFF_REF" as const
const AFF_COOKIE_MIN_LENGTH = 4 as const
const AFF_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 30

type ProxySessionUser = {
  readonly id?: string
}

type ProxySession = {
  readonly user?: ProxySessionUser | null
}

type NormalizedPathResult = Readonly<{
  pathname: string
  destUrl: URL | null
}>

function normalizeLocalePath(nextUrl: URL): NormalizedPathResult {
  const firstSeg: string = nextUrl.pathname.split("/")[1] ?? ""
  const enabledCodes: readonly string[] = LOCALES_CONFIG.options
    .filter((o) => o.enabled)
    .map((o) => o.code)
  if (!enabledCodes.includes(firstSeg)) {
    return { pathname: nextUrl.pathname, destUrl: null }
  }

  const dest = new URL(nextUrl.toString())
  const re = new RegExp(`^/(?:${enabledCodes.join("|")})(?=/|$)`)
  dest.pathname = nextUrl.pathname.replace(re, "") || "/"
  return { pathname: dest.pathname, destUrl: dest }
}

function attachAffiliateCookie(res: NextResponse, ref: string | null, isProd: boolean): void {
  if (!ref || ref.length < AFF_COOKIE_MIN_LENGTH) {
    return
  }

  res.cookies.set({
    name: AFF_COOKIE_NAME,
    value: ref,
    path: "/",
    sameSite: "lax",
    secure: isProd,
    maxAge: AFF_COOKIE_MAX_AGE_SECONDS,
  })
}

function buildCallbackUrl(nextUrl: URL): string {
  let callbackUrl: string = nextUrl.pathname
  if (nextUrl.search) {
    callbackUrl += nextUrl.search
  }
  return callbackUrl
}

function createLoginRedirect(nextUrl: URL, callbackUrl: string): NextResponse {
  const encoded: string = encodeURIComponent(callbackUrl)
  const target: URL = new URL(`${LOGIN_ROUTE}?callbackUrl=${encoded}`, nextUrl)
  return NextResponse.redirect(target)
}

export default async function proxy(req: NextRequest): Promise<NextResponse> {
  const t0: number = Date.now()
  const originalUrl: URL = req.nextUrl
  const isProd: boolean = (process.env.NODE_ENV ?? "development") === "production"
  const ref: string | null = originalUrl.searchParams.get("ref")

  const { pathname, destUrl } = normalizeLocalePath(originalUrl)

  let res: NextResponse
  if (destUrl) {
    res = NextResponse.rewrite(destUrl)
  } else {
    res = NextResponse.next()
  }

  attachAffiliateCookie(res, ref, isProd)

  if (!pathname.startsWith(DASHBOARD_PREFIX)) {
    res.headers.set("Server-Timing", `proxy;desc=skip;dur=${Date.now() - t0}`)
    return res
  }

  const session = (await auth.api.getSession({ headers: req.headers })) as ProxySession | null
  const user: ProxySessionUser | null | undefined = session?.user

  if (!user) {
    const callbackUrl: string = buildCallbackUrl(destUrl ?? originalUrl)
    const loginRes: NextResponse = createLoginRedirect(originalUrl, callbackUrl)
    loginRes.headers.set("Server-Timing", `proxy;desc=auth-redirect;dur=${Date.now() - t0}`)
    return loginRes
  }

  res.headers.set("Server-Timing", `proxy;desc=ok;dur=${Date.now() - t0}`)
  return res
}

export const config = {
  runtime: "nodejs",
  matcher: ["/:path*"],
}
