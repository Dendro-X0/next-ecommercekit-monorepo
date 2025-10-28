import { index, integer, pgTable, timestamp, unique, varchar } from "drizzle-orm/pg-core"

/**
 * Affiliate schema tables
 */

/**
 * Affiliate profiles: one per user.
 */
export const affiliateProfiles = pgTable(
  "affiliate_profiles",
  {
    id: varchar({ length: 60 }).primaryKey(),
    userId: varchar("user_id", { length: 60 }).notNull(),
    code: varchar({ length: 40 }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => {
    return {
      uqAffiliateUserId: unique("uq_affiliate_user_id").on(table.userId),
      uqAffiliateCode: unique("uq_affiliate_code").on(table.code),
      idxAffiliateCreatedAt: index("idx_affiliate_created_at").on(table.createdAt),
    } as const
  },
)

/**
 * Affiliate clicks: page visits attributed to a referral code.
 */
export const affiliateClicks = pgTable(
  "affiliate_clicks",
  {
    id: varchar({ length: 60 }).primaryKey(),
    code: varchar({ length: 40 }).notNull(),
    userId: varchar("user_id", { length: 60 }),
    ipHash: varchar("ip_hash", { length: 64 }).notNull(),
    userAgentHash: varchar("ua_hash", { length: 64 }).notNull(),
    source: varchar({ length: 120 }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    convertedAt: timestamp("converted_at", { withTimezone: true }),
  },
  (table) => {
    return {
      idxClicksCode: index("idx_affiliate_clicks_code").on(table.code),
      idxClicksCreatedAt: index("idx_affiliate_clicks_created_at").on(table.createdAt),
      idxClicksConvertedAt: index("idx_affiliate_clicks_converted_at").on(table.convertedAt),
    } as const
  },
)

/**
 * Affiliate conversions: successful orders attributed to a referral code.
 */
export const affiliateConversions = pgTable(
  "affiliate_conversions",
  {
    id: varchar({ length: 60 }).primaryKey(),
    clickId: varchar("click_id", { length: 60 }).notNull(),
    orderId: varchar("order_id", { length: 60 }).notNull(),
    userId: varchar("user_id", { length: 60 }),
    code: varchar({ length: 40 }).notNull(),
    commissionCents: integer("commission_cents").notNull().default(0),
    status: varchar({ length: 20 }).notNull().default("pending"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    paidAt: timestamp("paid_at", { withTimezone: true }),
  },
  (table) => {
    return {
      uqAffiliateOrderId: unique("uq_affiliate_order_id").on(table.orderId),
      idxConversionsCode: index("idx_affiliate_conversions_code").on(table.code),
      idxConversionsStatus: index("idx_affiliate_conversions_status").on(table.status),
      idxConversionsCreatedAt: index("idx_affiliate_conversions_created_at").on(table.createdAt),
    } as const
  },
)

/**
 * Affiliate conversion events: immutable audit trail for admin actions.
 */
export const affiliateConversionEvents = pgTable(
  "affiliate_conversion_events",
  {
    id: varchar({ length: 60 }).primaryKey(),
    conversionId: varchar("conversion_id", { length: 60 }).notNull(),
    actorEmail: varchar("actor_email", { length: 200 }),
    action: varchar({ length: 40 }).notNull(),
    fromStatus: varchar("from_status", { length: 20 }),
    toStatus: varchar("to_status", { length: 20 }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => {
    return {
      idxConvEventsConversionId: index("idx_conv_events_conversion_id").on(table.conversionId),
      idxConvEventsCreatedAt: index("idx_conv_events_created_at").on(table.createdAt),
    } as const
  },
)
