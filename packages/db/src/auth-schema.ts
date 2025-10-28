/**
 * Single export: authSchema for Better Auth drizzle adapter.
 */
import { account, session, user, verification } from "./schema/auth"

/**
 * Group tables expected by Better Auth's Drizzle adapter.
 */
export const authSchema = {
  user,
  session,
  account,
  verification,
} as const
