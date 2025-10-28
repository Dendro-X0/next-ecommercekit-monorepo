import { boolean, pgTable, text, timestamp, uniqueIndex, varchar } from "drizzle-orm/pg-core"
import { user } from "./auth"

/**
 * Preferences table schema.
 * One row per user.
 */
export const preferences = pgTable(
  "preferences",
  {
    userId: text("user_id")
      .primaryKey()
      .references(() => user.id, { onDelete: "cascade" }),
    newsletter: boolean("newsletter").notNull().default(false),
    notifications: boolean("notifications").notNull().default(true),
    smsUpdates: boolean("sms_updates").notNull().default(false),
    theme: varchar("theme", { length: 10 }).notNull().default("system"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => {
    return {
      uqPreferencesUser: uniqueIndex("uq_preferences_user").on(table.userId),
    } as const
  },
)
