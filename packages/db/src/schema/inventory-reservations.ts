import { index, integer, pgTable, timestamp, varchar } from "drizzle-orm/pg-core"

/**
 * Inventory reservations audit table.
 * A reservation references an order and a product with a quantity.
 * Status flow: reserved -> committed | released
 */
export const inventoryReservations = pgTable(
  "inventory_reservations",
  {
    id: varchar({ length: 60 }).primaryKey(),
    orderId: varchar("order_id", { length: 60 }).notNull(),
    productId: varchar("product_id", { length: 40 }).notNull(),
    qty: integer("qty").notNull(),
    status: varchar({ length: 20 }).notNull().default("reserved"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => {
    return {
      idxInvResOrder: index("idx_inv_res_order").on(table.orderId),
      idxInvResProduct: index("idx_inv_res_product").on(table.productId),
    } as const
  },
)
