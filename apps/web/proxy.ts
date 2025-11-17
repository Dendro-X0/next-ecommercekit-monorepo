import { auth } from "@repo/auth"
import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"

/**
 * Next.js 16 proxy entrypoint for auth gating.
 *
 * - Runs for dashboard routes.
 * - Redirects unauthenticated users to /auth/login with a callbackUrl.
 * - Leaves locale and affiliate-ref logic in src/middleware.ts.
 */
const DASHBOARD_PREFIX = "/dashboard" as const
const LOGIN_ROUTE = "/auth/login" as const

type ProxySessionUser = {
  readonly id?: string
}

type ProxySession = {
  readonly user?: ProxySessionUser | null
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
  const { nextUrl } = req
  const pathname: string = nextUrl.pathname

  if (!pathname.startsWith(DASHBOARD_PREFIX)) {
    const passthrough: NextResponse = NextResponse.next()
    passthrough.headers.set("Server-Timing", `proxy;desc=skip;dur=${Date.now() - t0}`)
    return passthrough
  }

  const session = (await auth.api.getSession({ headers: req.headers })) as ProxySession | null
  const user: ProxySessionUser | null | undefined = session?.user

  if (!user) {
    const callbackUrl: string = buildCallbackUrl(nextUrl)
    const res: NextResponse = createLoginRedirect(nextUrl, callbackUrl)
    res.headers.set("Server-Timing", `proxy;desc=auth-redirect;dur=${Date.now() - t0}`)
    return res
  }

  const res: NextResponse = NextResponse.next()
  res.headers.set("Server-Timing", `proxy;desc=ok;dur=${Date.now() - t0}`)
  return res
}

export const config = {
  runtime: "nodejs",
  matcher: ["/dashboard/:path*"],
} as const
