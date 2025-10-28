import { boolean, index, pgTable, text, timestamp, varchar } from "drizzle-orm/pg-core"
import { user } from "./auth"

/**
 * Addresses table schema.
 * - `type` is a string constrained at the API level: "shipping" | "billing".
 */
export const addresses = pgTable(
  "addresses",
  {
    id: varchar({ length: 40 }).primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    type: varchar("type", { length: 20 }).notNull(), // "shipping" | "billing"
    name: varchar({ length: 200 }).notNull(),
    street: varchar({ length: 200 }).notNull(),
    city: varchar({ length: 100 }).notNull(),
    state: varchar({ length: 100 }).notNull(),
    zipCode: varchar("zip_code", { length: 20 }).notNull(),
    country: varchar({ length: 100 }).notNull(),
    isDefault: boolean("is_default").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => {
    return {
      idxAddressesUser: index("idx_addresses_user").on(table.userId),
      idxAddressesType: index("idx_addresses_type").on(table.type),
    } as const
  },
)
