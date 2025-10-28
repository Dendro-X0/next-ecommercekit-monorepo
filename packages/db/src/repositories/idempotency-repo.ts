import { and, eq } from "drizzle-orm"
import { db } from "../db"
import { idempotencyKeys } from "../schema/idempotency"

/** Public interface for idempotency records */
export interface IdempotencyRecord {
  readonly key: string
  readonly scope: string
  readonly requestHash: string
  readonly responseJson: string
  readonly status: number
  readonly createdAt: Date
}

/** Repository for idempotency keys */
export default {
  /** Fetch an idempotency record by key and scope. */
  async getByKeyScope(key: string, scope: string): Promise<IdempotencyRecord | null> {
    const rows = await db
      .select()
      .from(idempotencyKeys)
      .where(and(eq(idempotencyKeys.key, key), eq(idempotencyKeys.scope, scope)))
    if (rows.length === 0) return null
    const r = rows[0] as unknown as IdempotencyRecord
    return { ...r, createdAt: new Date((r as unknown as { createdAt: Date }).createdAt) }
  },

  /**
   * Create a new idempotency record. Will throw on unique conflict.
   */
  async create(
    input: Readonly<{
      key: string
      scope: string
      requestHash: string
      responseJson: string
      status: number
    }>,
  ): Promise<IdempotencyRecord> {
    const rows = await db
      .insert(idempotencyKeys)
      .values({
        key: input.key,
        scope: input.scope,
        requestHash: input.requestHash,
        responseJson: input.responseJson,
        status: input.status,
      })
      .returning()
    const r = rows[0] as unknown as IdempotencyRecord
    return { ...r, createdAt: new Date((r as unknown as { createdAt: Date }).createdAt) }
  },
} as const
