import { index, integer, pgTable, text, timestamp, unique, varchar } from "drizzle-orm/pg-core"

/**
 * Table to store idempotency responses for API endpoints.
 */
export const idempotencyKeys = pgTable(
  "idempotency_keys",
  {
    /** Public idempotency key provided by client */
    key: varchar({ length: 120 }).notNull(),
    /** Logical scope for the endpoint, e.g., "stripe_intent" or "order_create:<user|guest-id>" */
    scope: varchar({ length: 120 }).notNull(),
    /** SHA-256 hash of the request body to ensure same-payload reuse */
    requestHash: varchar("request_hash", { length: 64 }).notNull(),
    /** Stored JSON response body to return for retries */
    responseJson: text("response_json").notNull(),
    /** HTTP status code returned */
    status: integer().notNull(),
    /** Creation timestamp */
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => {
    return {
      /** Enforce uniqueness of key within a scope */
      uqKeyScope: unique("uq_idem_key_scope").on(table.key, table.scope),
      idxCreatedAt: index("idx_idem_created_at").on(table.createdAt),
    } as const
  },
)
