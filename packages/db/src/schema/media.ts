import { index, integer, jsonb, pgTable, text, timestamp, varchar } from "drizzle-orm/pg-core"

/**
 * Media table: stores uploaded media metadata and public URL.
 */
export const media = pgTable(
  "media",
  {
    id: varchar({ length: 40 }).primaryKey(),
    provider: varchar({ length: 20 }).notNull().default("s3"),
    bucket: varchar({ length: 200 }),
    key: varchar({ length: 500 }),
    url: text("url").notNull(),
    kind: varchar({ length: 10 }).notNull(), // image | video
    contentType: varchar("content_type", { length: 120 }),
    bytes: integer("bytes"),
    width: integer("width"),
    height: integer("height"),
    checksum: varchar({ length: 128 }),
    uploaderIp: varchar("uploader_ip", { length: 64 }),
    uploaderEmail: varchar("uploader_email", { length: 200 }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    extra: jsonb("extra").$type<Readonly<Record<string, unknown>>>(),
  },
  (table) => {
    return {
      idxMediaCreatedAt: index("idx_media_created_at").on(table.createdAt),
      idxMediaUploaderIp: index("idx_media_uploader_ip").on(table.uploaderIp),
    } as const
  },
)
