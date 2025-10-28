/**
 * Admin guard utilities.
 * One export per file: `AdminGuard`.
 */
import type { Context } from "hono"
import { apiEnv } from "../env"

/** Narrowed user shape extracted from request context. */
type AppUser = Readonly<{
  id: string
  email?: string
  role?: string
  roles?: readonly string[]
  isAdmin?: boolean
}>

/**
 * AdminGuard provides helpers to read the current user and enforce admin access.
 */
export class AdminGuard {
  /** Read the current user from Hono context. */
  public static getUser(c: Context): AppUser | null {
    const user = c.get("user") as unknown
    if (!user || typeof user !== "object") return null
    return user as AppUser
  }

  /** Ensure the user is an admin (role-based or email allowlist). Returns a 401/403 Response or null if allowed. */
  public static ensureAdmin(c: Context): Response | null {
    const user = AdminGuard.getUser(c)
    if (!user) return c.json({ error: "Unauthorized" }, 401)
    const byRole: boolean =
      user.isAdmin === true ||
      user.role === "admin" ||
      (Array.isArray(user.roles) && user.roles.includes("admin"))
    const email: string = typeof user.email === "string" ? user.email.toLowerCase() : ""
    const byEnv: boolean = !!email && apiEnv.ADMIN_EMAILS_SET.has(email)
    const isAdmin: boolean = byRole || byEnv
    if (!isAdmin) return c.json({ error: "Forbidden" }, 403)
    return null
  }
}
