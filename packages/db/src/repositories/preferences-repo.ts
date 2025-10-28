import { eq } from "drizzle-orm"
import { db } from "../db"
import { preferences } from "../schema/preferences"

export type PreferencesDTO = Readonly<{
  userId: string
  newsletter: boolean
  notifications: boolean
  smsUpdates: boolean
  theme: "light" | "dark" | "system"
}>

export type UpdatePreferencesInput = Readonly<{
  newsletter?: boolean
  notifications?: boolean
  smsUpdates?: boolean
  theme?: "light" | "dark" | "system"
}>

function mapRow(r: typeof preferences.$inferSelect): PreferencesDTO {
  const theme: "light" | "dark" | "system" =
    r.theme === "light" || r.theme === "dark" ? r.theme : "system"
  return {
    userId: r.userId,
    newsletter: !!r.newsletter,
    notifications: !!r.notifications,
    smsUpdates: !!r.smsUpdates,
    theme,
  } as const
}

async function get(userId: string): Promise<PreferencesDTO | null> {
  const rows = await db.select().from(preferences).where(eq(preferences.userId, userId)).limit(1)
  if (!rows.length) return null
  return mapRow(rows[0])
}

async function getOrCreate(userId: string): Promise<PreferencesDTO> {
  const existing = await get(userId)
  if (existing) return existing
  const row = (await db.insert(preferences).values({ userId }).returning())[0]
  return mapRow(row)
}

async function update(userId: string, patch: UpdatePreferencesInput): Promise<PreferencesDTO> {
  const fields: Partial<typeof preferences.$inferInsert> = { updatedAt: new Date() }
  if (typeof patch.newsletter === "boolean") fields.newsletter = patch.newsletter
  if (typeof patch.notifications === "boolean") fields.notifications = patch.notifications
  if (typeof patch.smsUpdates === "boolean") fields.smsUpdates = patch.smsUpdates
  if (typeof patch.theme === "string") fields.theme = patch.theme
  const row = (
    await db.update(preferences).set(fields).where(eq(preferences.userId, userId)).returning()
  )[0]
  if (row) return mapRow(row)
  // Upsert fallback
  const inserted = (
    await db
      .insert(preferences)
      .values({ userId, ...fields })
      .onConflictDoUpdate({ target: preferences.userId, set: fields })
      .returning()
  )[0]
  return mapRow(inserted)
}

const preferencesRepo = {
  get,
  getOrCreate,
  update,
} as const

export default preferencesRepo
