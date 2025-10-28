import { index, pgTable, text, timestamp, varchar } from "drizzle-orm/pg-core"

/**
 * Media events/audit logs.
 */
export const mediaEvents = pgTable(
  "media_events",
  {
    id: varchar({ length: 50 }).primaryKey(),
    mediaId: varchar("media_id", { length: 40 }),
    action: varchar({ length: 40 }).notNull(), // upload|delete|transcode|error
    actorEmail: varchar("actor_email", { length: 200 }),
    ip: varchar({ length: 64 }),
    message: text("message"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => {
    return {
      idxMediaEventsMedia: index("idx_media_events_media").on(table.mediaId),
      idxMediaEventsAction: index("idx_media_events_action").on(table.action),
      idxMediaEventsCreatedAt: index("idx_media_events_created_at").on(table.createdAt),
    } as const
  },
)
