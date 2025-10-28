import { index, integer, pgTable, text, timestamp, varchar } from "drizzle-orm/pg-core"

/**
 * Product reviews schema
 */
export const reviews = pgTable(
  "reviews",
  {
    id: varchar({ length: 60 }).primaryKey(),
    userId: varchar("user_id", { length: 60 }),
    productId: varchar("product_id", { length: 60 }).notNull(),
    rating: integer("rating").notNull(), // 1..5
    title: varchar({ length: 200 }),
    content: text("content"),
    status: varchar({ length: 20 }).notNull().default("Pending"), // Pending | Published | Rejected
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => {
    return {
      idxReviewsProduct: index("idx_reviews_product").on(table.productId),
      idxReviewsUser: index("idx_reviews_user").on(table.userId),
      idxReviewsStatus: index("idx_reviews_status").on(table.status),
      idxReviewsCreatedAt: index("idx_reviews_created_at").on(table.createdAt),
    } as const
  },
)
