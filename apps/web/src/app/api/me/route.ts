import { auth } from "@repo/auth"
import { headers } from "next/headers"

type MeUser = Readonly<{
  id?: string
  email?: string
  name?: string | null
  image?: string | null
  roles?: readonly string[]
  emailVerified?: boolean
  isAdmin?: boolean
}>

/**
 * Build a lowercase allowlist from server-visible envs.
 * NEXT_PUBLIC_ADMIN_EMAILS is accepted as a convenience but ADMIN_EMAILS is authoritative.
 */
function getAdminAllowlist(): ReadonlySet<string> {
  const rawServer: string | undefined = process.env.ADMIN_EMAILS
  const rawPublic: string | undefined = process.env.NEXT_PUBLIC_ADMIN_EMAILS
  const raw: string | undefined = rawServer ?? rawPublic
  if (!raw) return new Set<string>()
  const set = new Set<string>()
  for (const part of raw.split(",")) {
    const v = part.trim().toLowerCase()
    if (v) set.add(v)
  }
  return set
}

/**
 * GET /api/me
 * Returns a trusted user payload with an `isAdmin` flag computed on the server.
 */
export async function GET(): Promise<Response> {
  const hdrs = await headers()
  const session = await auth.api.getSession({ headers: hdrs })
  const u = session?.user as
    | {
      readonly id?: string
      readonly email?: string
      readonly name?: unknown
      readonly image?: unknown
      readonly roles?: unknown
      readonly emailVerified?: unknown
    }
    | undefined
  if (!u) return Response.json({ user: null })
  const roles: readonly string[] | undefined = Array.isArray(u?.roles)
    ? (u?.roles as unknown[]).every((x) => typeof x === "string")
      ? (u?.roles as readonly string[])
      : undefined
    : undefined
  const email: string | undefined = typeof u?.email === "string" ? (u?.email as string) : undefined
  const allow = getAdminAllowlist()
  const isAdminByRole: boolean = Array.isArray(roles) && roles.includes("admin")
  const isAdminByEmail: boolean = !!email && allow.has(email.toLowerCase())
  const user: MeUser = {
    id: typeof u.id === "string" ? (u.id as string) : undefined,
    email,
    name: typeof u.name === "string" ? (u.name as string) : null,
    image: typeof u.image === "string" ? (u.image as string) : null,
    roles,
    emailVerified: typeof u.emailVerified === "boolean" ? (u.emailVerified as boolean) : undefined,
    isAdmin: isAdminByRole || isAdminByEmail,
  }
  return Response.json({ user })
}
