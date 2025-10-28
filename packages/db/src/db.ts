import { neon } from "@neondatabase/serverless"
import { drizzle, type NeonHttpDatabase } from "drizzle-orm/neon-http"

/**
 * Drizzle ORM instance using Neon HTTP driver.
 * Lazily initialized so that DATABASE_URL is only read at runtime
 * (prevents build-time failures on platforms that don't inject envs
 * into the compiler process for server bundles).
 * - Works on serverless/edge runtimes
 * - Single export per file, per project conventions
 */
type DbType = NeonHttpDatabase<Record<string, never>>

function createDb(): DbType {
  const url: string | undefined = process.env.DATABASE_URL
  if (!url) {
    throw new Error("DATABASE_URL is required")
  }
  const sql = neon(url)
  return drizzle(sql)
}

let cached: DbType | null = null

export const db: DbType = new Proxy({} as DbType, {
  get(_target, prop, _receiver) {
    if (!cached) cached = createDb()
    // Indexing into the Drizzle database instance
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const value: unknown = (cached as unknown as Record<PropertyKey, unknown>)[prop]
    // Bind methods to the underlying instance to preserve `this`
    return typeof value === "function"
      ? (value as (...args: unknown[]) => unknown).bind(cached)
      : value
  },
}) as DbType
