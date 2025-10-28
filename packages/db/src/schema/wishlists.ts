import { boolean, index, pgTable, timestamp, unique, varchar } from "drizzle-orm/pg-core"

/**
 * Wishlists schema
 */
export const wishlists = pgTable(
  "wishlists",
  {
    id: varchar({ length: 60 }).primaryKey(),
    /** Optional authenticated user id (from Better Auth) */
    userId: varchar("user_id", { length: 60 }),
    /** Guest identifier derived from cookie when user is not authenticated. */
    guestId: varchar("guest_id", { length: 80 }),
    name: varchar({ length: 120 }).notNull().default("My Wishlist"),
    isPublic: boolean("is_public").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => {
    return {
      idxWishlistsCreatedAt: index("idx_wishlists_created_at").on(table.createdAt),
      idxWishlistsUserId: index("idx_wishlists_user_id").on(table.userId),
      idxWishlistsGuestId: index("idx_wishlists_guest_id").on(table.guestId),
      uqWishlistOwner: unique("uq_wishlist_owner").on(table.userId, table.guestId),
    } as const
  },
)

/**
 * Wishlist items schema
 */
export const wishlistItems = pgTable(
  "wishlist_items",
  {
    id: varchar({ length: 60 }).primaryKey(),
    wishlistId: varchar("wishlist_id", { length: 60 }).notNull(),
    productId: varchar("product_id", { length: 60 }).notNull(),
    addedAt: timestamp("added_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => {
    return {
      idxWishlistItemsWishlistId: index("idx_wishlist_items_wishlist_id").on(table.wishlistId),
      idxWishlistItemsProductId: index("idx_wishlist_items_product_id").on(table.productId),
      uqWishlistProduct: unique("uq_wishlist_product").on(table.wishlistId, table.productId),
    } as const
  },
)
