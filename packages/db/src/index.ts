/**
 * Single export for the database instance.
 */
export { db } from "./db"
export { default as productsRepo } from "./repositories/products-repo"
export { default as categoriesRepo } from "./repositories/categories-repo"
export { default as ordersRepo } from "./repositories/orders-repo"
// Re-export schema tables for consumers that need direct queries (e.g., admin stats)
export { products } from "./schema/products"
export { categories } from "./schema/categories"
export { orders, orderItems } from "./schema/orders"
export { default as addressesRepo } from "./repositories/addresses-repo"
export { default as preferencesRepo } from "./repositories/preferences-repo"
export { addresses } from "./schema/addresses"
export { preferences } from "./schema/preferences"
export { default as wishlistsRepo } from "./repositories/wishlists-repo"
export { wishlists, wishlistItems } from "./schema/wishlists"
// Affiliate exports
export { default as affiliateRepo } from "./repositories/affiliate-repo"
export {
  affiliateProfiles,
  affiliateClicks,
  affiliateConversions,
  affiliateConversionEvents,
} from "./schema/affiliate"
// Reviews exports
export { default as reviewsRepo } from "./repositories/reviews-repo"
export { reviews } from "./schema/reviews"
// Customers exports
export { default as customersRepo } from "./repositories/customers-repo"
// Contacts exports
export { default as contactsRepo } from "./repositories/contacts-repo"
export { contacts } from "./schema/contacts"
// Idempotency exports
export { default as idempotencyRepo } from "./repositories/idempotency-repo"
export { idempotencyKeys } from "./schema/idempotency"
// Inventory exports
export { default as inventoryRepo } from "./repositories/inventory-repo"
export { inventory } from "./schema/inventory"
export { inventoryReservations } from "./schema/inventory-reservations"
// Media exports
export { media } from "./schema/media"
export { productMedia } from "./schema/product-media"
export { mediaEvents } from "./schema/media-events"
// Re-export Drizzle helpers for consumers to avoid extra deps in app packages
export { sql, and, eq, gt } from "drizzle-orm"
