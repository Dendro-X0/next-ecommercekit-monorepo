import { index, pgTable, text, timestamp, varchar } from "drizzle-orm/pg-core"

/**
 * Contact messages schema
 */
export const contacts = pgTable(
  "contacts",
  {
    id: varchar({ length: 60 }).primaryKey(),
    name: varchar({ length: 100 }).notNull(),
    email: varchar({ length: 200 }).notNull(),
    subject: varchar({ length: 200 }).notNull(),
    message: text("message").notNull(),
    phone: varchar({ length: 50 }),
    ip: varchar({ length: 45 }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => {
    return {
      idxContactsEmail: index("idx_contacts_email").on(table.email),
      idxContactsCreatedAt: index("idx_contacts_created_at").on(table.createdAt),
    } as const
  },
)
