import {
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core"

/**
 * Products table schema.
 * Prices are stored in cents (integer) to avoid floating point issues.
 */
export const products = pgTable(
  "products",
  {
    id: varchar({ length: 40 }).primaryKey(),
    slug: varchar({ length: 200 }).notNull().unique(),
    name: varchar({ length: 200 }).notNull(),
    priceCents: integer("price_cents").notNull(),
    currency: varchar({ length: 3 }).notNull().default("USD"),
    imageUrl: text("image_url"),
    /** Optional long-form product description. */
    description: text("description"),
    /**
     * Media gallery for product. Each item has { url, kind: 'image' | 'video' }.
     */
    media:
      jsonb("media").$type<ReadonlyArray<Readonly<{ url: string; kind: "image" | "video" }>>>(),
    categorySlug: varchar("category_slug", { length: 100 }),
    featured: boolean("featured").notNull().default(false),
    /** "digital" or "physical" */
    kind: varchar("kind", { length: 20 }),
    /** Whether shipping is required (physical goods). */
    shippingRequired: boolean("shipping_required").default(true),
    /** Product weight in grams to avoid floating point math. */
    weightGrams: integer("weight_grams"),
    /** Optional version for digital goods. */
    digitalVersion: varchar("digital_version", { length: 50 }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => {
    return {
      idxProductsCreatedAt: index("idx_products_created_at").on(table.createdAt),
      idxProductsCategorySlug: index("idx_products_category_slug").on(table.categorySlug),
    } as const
  },
)
