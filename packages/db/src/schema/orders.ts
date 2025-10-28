import { index, integer, pgTable, text, timestamp, varchar } from "drizzle-orm/pg-core"

// Payment-related column lengths
const PAYMENT_PROVIDER_LENGTH: number = 20
const PAYMENT_REF_LENGTH: number = 100

/**
 * Orders schema
 * Monetary fields are stored as cents (integers) for precision.
 */
export const orders = pgTable(
  "orders",
  {
    id: varchar({ length: 60 }).primaryKey(),
    /** Optional authenticated user id (from Better Auth) */
    userId: varchar("user_id", { length: 60 }),
    /** Guest identifier derived from cookie when user is not authenticated. */
    guestId: varchar("guest_id", { length: 80 }),
    email: varchar({ length: 200 }),
    /** Order lifecycle status */
    status: varchar({ length: 20 }).notNull().default("pending"),
    subtotalCents: integer("subtotal_cents").notNull().default(0),
    shippingCents: integer("shipping_cents").notNull().default(0),
    taxCents: integer("tax_cents").notNull().default(0),
    totalCents: integer("total_cents").notNull().default(0),
    /** Payment provider and external reference (e.g., Stripe PaymentIntent id) */
    paymentProvider: varchar("payment_provider", { length: PAYMENT_PROVIDER_LENGTH }),
    paymentRef: varchar("payment_ref", { length: PAYMENT_REF_LENGTH }),
    /** Affiliate attribution fields */
    affiliateCode: varchar("affiliate_code", { length: 20 }),
    affiliateClickId: varchar("affiliate_click_id", { length: 60 }),
    affiliateCommissionCents: integer("affiliate_commission_cents").notNull().default(0),
    affiliateStatus: varchar("affiliate_status", { length: 16 }).notNull().default("pending"),
    affiliateAttributedAt: timestamp("affiliate_attributed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => {
    return {
      idxOrdersCreatedAt: index("idx_orders_created_at").on(table.createdAt),
      idxOrdersUserId: index("idx_orders_user_id").on(table.userId),
      idxOrdersGuestId: index("idx_orders_guest_id").on(table.guestId),
      idxOrdersStatus: index("idx_orders_status").on(table.status),
      idxOrdersPaymentRef: index("idx_orders_payment_ref").on(table.paymentRef),
      idxOrdersAffiliateCode: index("idx_orders_affiliate_code").on(table.affiliateCode),
      idxOrdersAffiliateStatus: index("idx_orders_affiliate_status").on(table.affiliateStatus),
    } as const
  },
)

/**
 * Order items schema.
 */
export const orderItems = pgTable(
  "order_items",
  {
    id: varchar({ length: 60 }).primaryKey(),
    orderId: varchar("order_id", { length: 60 }).notNull(),
    productId: varchar("product_id", { length: 60 }),
    name: varchar({ length: 200 }).notNull(),
    priceCents: integer("price_cents").notNull(),
    quantity: integer().notNull().default(1),
    imageUrl: text("image_url"),
  },
  (table) => {
    return {
      idxOrderItemsOrderId: index("idx_order_items_order_id").on(table.orderId),
    } as const
  },
)
