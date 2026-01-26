/**
 * Server-side session fetcher using the Next.js request headers.
 * Receive Object -> Return Object (RO-RO) style.
 */
type SessionUser = {
  readonly id: string
  readonly email: string
  readonly name: string | null
  readonly image?: string | null
  readonly roles?: readonly string[]
  readonly emailVerified?: boolean
}
type Session = { readonly user: SessionUser | null }
type HeaderLike = { get(name: string): string | null }
type GetServerSessionInput = { readonly headers: HeaderLike }

function buildBaseUrl(headers: HeaderLike): string {
  const envBase = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL
  if (envBase && typeof envBase === "string" && envBase.length > 0) return envBase
  const proto =
    headers.get("x-forwarded-proto") || (process.env.NODE_ENV === "development" ? "http" : "https")
  const host = headers.get("x-forwarded-host") || headers.get("host")
  if (host) return `${proto}://${host}`
  return "http://localhost:3000"
}

/**
 * Fetches the Better Auth session via HTTP so it works across deployments and proxies.
 */
export async function getServerSession({
  headers,
}: GetServerSessionInput): Promise<Session | null> {
  // Mock session for development/testing if enabled
  if (process.env.NODE_ENV === "development" && process.env.ENABLE_DEBUG_SESSION === "true") {
    return {
      user: {
        id: "mock-user-123",
        email: "dendro-x0@example.com",
        name: "Dendro-X0",
        image: "https://github.com/Dendro-X0.png",
        roles: ["user", "admin"],
        emailVerified: true,
      },
    }
  }

  const base = buildBaseUrl(headers)
  const h = new Headers()
  const cookie = headers.get("cookie") || ""
  if (cookie) h.set("cookie", cookie)
  h.set("accept", "application/json")
  try {
    const res = await fetch(`${base}/api/auth/get-session`, {
      method: "GET",
      headers: h,
      cache: "no-store",
      next: { revalidate: 0 },
    })
    if (!res.ok) return { user: null }
    const data = (await res.json()) as { readonly user?: unknown }
    const u = data?.user as
      | (Record<string, unknown> & {
        id?: unknown
        email?: unknown
        name?: unknown
        image?: unknown
        roles?: unknown
        emailVerified?: unknown
      })
      | undefined
    if (!u) return { user: null }
    const rolesRaw = u.roles
    const roles =
      Array.isArray(rolesRaw) && rolesRaw.every((x) => typeof x === "string")
        ? (rolesRaw as readonly string[])
        : undefined
    const user: SessionUser = {
      id: String(u.id ?? ""),
      email: String(u.email ?? ""),
      name: typeof u.name === "string" ? (u.name as string) : null,
      image: typeof u.image === "string" ? (u.image as string) : undefined,
      roles,
      emailVerified:
        typeof u.emailVerified === "boolean" ? (u.emailVerified as boolean) : undefined,
    }
    return { user }
  } catch {
    return { user: null }
  }
}
