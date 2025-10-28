import { index, pgTable, text, timestamp, varchar } from "drizzle-orm/pg-core"

/**
 * Categories table schema.
 */
export const categories = pgTable(
  "categories",
  {
    id: varchar({ length: 40 }).primaryKey(),
    slug: varchar({ length: 100 }).notNull().unique(),
    name: varchar({ length: 200 }).notNull(),
    imageUrl: text("image_url"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => {
    return {
      idxCategoriesSlug: index("idx_categories_slug").on(table.slug),
      idxCategoriesCreatedAt: index("idx_categories_created_at").on(table.createdAt),
    } as const
  },
)
