/**
 * Single export for the database instance.
 */

// Re-export Drizzle helpers for consumers to avoid extra deps in app packages
export { and, eq, gt, sql } from "drizzle-orm"
export { db } from "./db"
export { default as addressesRepo } from "./repositories/addresses-repo"
// Affiliate exports
export { default as affiliateRepo } from "./repositories/affiliate-repo"
export { default as categoriesRepo } from "./repositories/categories-repo"
// Contacts exports
export { default as contactsRepo } from "./repositories/contacts-repo"
// Customers exports
export { default as customersRepo } from "./repositories/customers-repo"
// Idempotency exports
export { default as idempotencyRepo } from "./repositories/idempotency-repo"
// Inventory exports
export { default as inventoryRepo } from "./repositories/inventory-repo"
export { default as ordersRepo } from "./repositories/orders-repo"
export { default as preferencesRepo } from "./repositories/preferences-repo"
export { default as productsRepo } from "./repositories/products-repo"
// Reviews exports
export { default as reviewsRepo } from "./repositories/reviews-repo"
export { default as wishlistsRepo } from "./repositories/wishlists-repo"
export { addresses } from "./schema/addresses"
export {
  affiliateClicks,
  affiliateConversionEvents,
  affiliateConversions,
  affiliateProfiles,
} from "./schema/affiliate"
export { categories } from "./schema/categories"
export { contacts } from "./schema/contacts"
export { idempotencyKeys } from "./schema/idempotency"
export { inventory } from "./schema/inventory"
export { inventoryReservations } from "./schema/inventory-reservations"
// Media exports
export { media } from "./schema/media"
export { mediaEvents } from "./schema/media-events"
export { orderItems, orders } from "./schema/orders"
export { preferences } from "./schema/preferences"
export { productMedia } from "./schema/product-media"
// Re-export schema tables for consumers that need direct queries (e.g., admin stats)
export { products } from "./schema/products"
export { reviews } from "./schema/reviews"
export { wishlistItems, wishlists } from "./schema/wishlists"
