import { index, integer, pgTable, varchar } from "drizzle-orm/pg-core"

/**
 * Product to Media relation table with ordering.
 */
export const productMedia = pgTable(
  "product_media",
  {
    id: varchar({ length: 50 }).primaryKey(),
    productId: varchar("product_id", { length: 40 }).notNull(),
    mediaId: varchar("media_id", { length: 40 }).notNull(),
    position: integer("position").notNull().default(0),
  },
  (table) => {
    return {
      idxProductMediaProduct: index("idx_product_media_product").on(table.productId),
      idxProductMediaMedia: index("idx_product_media_media").on(table.mediaId),
    } as const
  },
)
