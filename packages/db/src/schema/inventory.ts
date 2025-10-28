import { index, integer, pgTable, timestamp, varchar } from "drizzle-orm/pg-core"

/**
 * Inventory table tracks on-hand stock per product.
 * Stock is an integer count of units available.
 */
export const inventory = pgTable(
  "inventory",
  {
    productId: varchar({ length: 40 }).primaryKey(),
    stockQty: integer("stock_qty").notNull().default(0),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => {
    return {
      idxInventoryUpdatedAt: index("idx_inventory_updated_at").on(table.updatedAt),
    } as const
  },
)
