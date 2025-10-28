import { randomUUID } from "node:crypto"
import { and, desc, eq, sql } from "drizzle-orm"
import { db } from "../db"
import {
  affiliateClicks,
  affiliateConversionEvents,
  affiliateConversions,
  affiliateProfiles,
} from "../schema/affiliate"

/**
 * Types for affiliate records and DTOs.
 */
export type AffiliateProfileRecord = Readonly<{
  id: string
  userId: string
  code: string
  createdAt: Date
  updatedAt: Date
}>

export type AffiliateClickRecord = Readonly<{
  id: string
  code: string
  userId: string | null
  ipHash: string
  userAgentHash: string
  source?: string | null
  createdAt: Date
  convertedAt?: Date | null
}>

export type AffiliateConversionRecord = Readonly<{
  id: string
  clickId: string
  orderId: string
  userId: string | null
  code: string
  commissionCents: number
  status: "pending" | "approved" | "paid"
  createdAt: Date
  paidAt?: Date | null
}>

export type AffiliateSummary = Readonly<{ totalClicks: number; conversions: number }>

export type AffiliateConversionEventRecord = Readonly<{
  id: string
  conversionId: string
  actorEmail?: string | null
  action: string
  fromStatus?: string | null
  toStatus?: string | null
  createdAt: Date
}>

const DEFAULT_LIST_LIMIT: number = 50 as const
const CODE_LENGTH: number = 10 as const
const MAX_GENERATE_ATTEMPTS: number = 5 as const

function toProfile(row: typeof affiliateProfiles.$inferSelect): AffiliateProfileRecord {
  return {
    id: row.id,
    userId: row.userId,
    code: row.code,
    createdAt: row.createdAt as unknown as Date,
    updatedAt: row.updatedAt as unknown as Date,
  }
}

function toClick(row: typeof affiliateClicks.$inferSelect): AffiliateClickRecord {
  return {
    id: row.id,
    code: row.code,
    userId: row.userId ?? null,
    ipHash: row.ipHash,
    userAgentHash: row.userAgentHash,
    source: row.source ?? null,
    createdAt: row.createdAt as unknown as Date,
    convertedAt: row.convertedAt as unknown as Date | null,
  }
}

function toConversion(row: typeof affiliateConversions.$inferSelect): AffiliateConversionRecord {
  return {
    id: row.id,
    clickId: row.clickId,
    orderId: row.orderId,
    userId: row.userId ?? null,
    code: row.code,
    commissionCents: row.commissionCents,
    status: row.status as "pending" | "approved" | "paid",
    createdAt: row.createdAt as unknown as Date,
    paidAt: row.paidAt as unknown as Date | null,
  }
}

function generateCode(): string {
  const alphabet: string = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
  let out = ""
  for (let i = 0; i < CODE_LENGTH; i++) {
    const n: number = Math.floor(Math.random() * alphabet.length)
    out += alphabet[n] as string
  }
  return out
}

/**
 * Profiles
 */
async function getByUserId(
  input: Readonly<{ userId: string }>,
): Promise<AffiliateProfileRecord | null> {
  const rows = await db
    .select()
    .from(affiliateProfiles)
    .where(eq(affiliateProfiles.userId, input.userId))
    .limit(1)
  if (!rows.length) return null
  return toProfile(rows[0]!)
}

async function getByCode(
  input: Readonly<{ code: string }>,
): Promise<AffiliateProfileRecord | null> {
  const rows = await db
    .select()
    .from(affiliateProfiles)
    .where(eq(affiliateProfiles.code, input.code))
    .limit(1)
  if (!rows.length) return null
  return toProfile(rows[0]!)
}

async function upsertForUser(input: Readonly<{ userId: string }>): Promise<AffiliateProfileRecord> {
  const existing = await getByUserId({ userId: input.userId })
  if (existing) return existing
  let attempt = 0
  while (attempt < MAX_GENERATE_ATTEMPTS) {
    const id = randomUUID()
    const code = generateCode()
    try {
      await db.insert(affiliateProfiles).values({ id, userId: input.userId, code })
      const rows = await db
        .select()
        .from(affiliateProfiles)
        .where(eq(affiliateProfiles.id, id))
        .limit(1)
      return toProfile(rows[0]!)
    } catch {
      attempt++
    }
  }
  throw new Error("Failed to generate unique affiliate code")
}

async function regenerateCode(
  input: Readonly<{ userId: string }>,
): Promise<AffiliateProfileRecord> {
  const profile = await upsertForUser({ userId: input.userId })
  let attempt = 0
  while (attempt < MAX_GENERATE_ATTEMPTS) {
    const code = generateCode()
    try {
      await db
        .update(affiliateProfiles)
        .set({ code, updatedAt: sql`now()` })
        .where(eq(affiliateProfiles.id, profile.id))
      const rows = await db
        .select()
        .from(affiliateProfiles)
        .where(eq(affiliateProfiles.id, profile.id))
        .limit(1)
      return toProfile(rows[0]!)
    } catch {
      attempt++
    }
  }
  throw new Error("Failed to regenerate unique affiliate code")
}

/**
 * Clicks
 */
async function createClick(
  input: Readonly<{
    code: string
    userId?: string | null
    ipHash: string
    userAgentHash: string
    source?: string | null
  }>,
): Promise<Readonly<{ id: string; createdAt: Date }>> {
  const id = randomUUID()
  await db.insert(affiliateClicks).values({
    id,
    code: input.code,
    userId: input.userId ?? undefined,
    ipHash: input.ipHash,
    userAgentHash: input.userAgentHash,
    source: input.source ?? undefined,
  })
  const rows = await db
    .select({ id: affiliateClicks.id, createdAt: affiliateClicks.createdAt })
    .from(affiliateClicks)
    .where(eq(affiliateClicks.id, id))
    .limit(1)
  const row = rows[0]!
  return { id: row.id, createdAt: row.createdAt as unknown as Date } as const
}

async function listClicksByCode(
  input: Readonly<{ code: string; limit?: number }>,
): Promise<readonly AffiliateClickRecord[]> {
  const limit = Math.min(input.limit ?? DEFAULT_LIST_LIMIT, DEFAULT_LIST_LIMIT)
  const rows = await db
    .select()
    .from(affiliateClicks)
    .where(eq(affiliateClicks.code, input.code))
    .orderBy(desc(affiliateClicks.createdAt))
    .limit(limit)
  return rows.map(toClick)
}

async function markClickConverted(
  input: Readonly<{ clickId: string; when?: Date }>,
): Promise<void> {
  await db
    .update(affiliateClicks)
    .set({ convertedAt: input.when ?? (sql`now()` as unknown as Date) })
    .where(eq(affiliateClicks.id, input.clickId))
}

/**
 * Conversions
 */
async function createConversion(
  input: Readonly<{
    clickId: string
    orderId: string
    userId?: string | null
    code: string
    commissionCents: number
    status?: "pending" | "approved" | "paid"
  }>,
): Promise<AffiliateConversionRecord> {
  const id = randomUUID()
  await db.insert(affiliateConversions).values({
    id,
    clickId: input.clickId,
    orderId: input.orderId,
    userId: input.userId ?? undefined,
    code: input.code,
    commissionCents: Math.max(0, Math.round(input.commissionCents)),
    status: (input.status ?? "pending") as "pending" | "approved" | "paid",
  })
  const rows = await db
    .select()
    .from(affiliateConversions)
    .where(eq(affiliateConversions.id, id))
    .limit(1)
  return toConversion(rows[0]!)
}

async function getConversionByOrderId(
  input: Readonly<{ orderId: string }>,
): Promise<AffiliateConversionRecord | null> {
  const rows = await db
    .select()
    .from(affiliateConversions)
    .where(eq(affiliateConversions.orderId, input.orderId))
    .limit(1)
  if (!rows.length) return null
  return toConversion(rows[0]!)
}

async function listConversionsByCode(
  input: Readonly<{ code: string; status?: "pending" | "approved" | "paid"; limit?: number }>,
): Promise<readonly AffiliateConversionRecord[]> {
  const limit = Math.min(input.limit ?? DEFAULT_LIST_LIMIT, DEFAULT_LIST_LIMIT)
  const where = input.status
    ? and(eq(affiliateConversions.code, input.code), eq(affiliateConversions.status, input.status))
    : eq(affiliateConversions.code, input.code)
  const rows = await db
    .select()
    .from(affiliateConversions)
    .where(where)
    .orderBy(desc(affiliateConversions.createdAt))
    .limit(limit)
  return rows.map(toConversion)
}

async function updateConversionStatus(
  input: Readonly<{ id: string; status: "pending" | "approved" | "paid"; paidAt?: Date | null }>,
): Promise<void> {
  await db
    .update(affiliateConversions)
    .set({ status: input.status, paidAt: input.paidAt ?? null })
    .where(eq(affiliateConversions.id, input.id))
}

async function appendConversionEvent(
  input: Readonly<{
    conversionId: string
    actorEmail?: string | null
    action: string
    fromStatus?: string | null
    toStatus?: string | null
  }>,
): Promise<Readonly<{ id: string; createdAt: Date }>> {
  const id = randomUUID()
  await db.insert(affiliateConversionEvents).values({
    id,
    conversionId: input.conversionId,
    actorEmail: input.actorEmail ?? undefined,
    action: input.action,
    fromStatus: input.fromStatus ?? undefined,
    toStatus: input.toStatus ?? undefined,
  })
  const rows = await db
    .select({ id: affiliateConversionEvents.id, createdAt: affiliateConversionEvents.createdAt })
    .from(affiliateConversionEvents)
    .where(eq(affiliateConversionEvents.id, id))
    .limit(1)
  const row = rows[0]!
  return { id: row.id, createdAt: row.createdAt as unknown as Date } as const
}

/**
 * Admin-wide helpers
 */
async function listConversionsAdmin(
  input: Readonly<{ status?: "pending" | "approved" | "paid"; limit?: number }>,
): Promise<readonly AffiliateConversionRecord[]> {
  const limit = Math.min(input.limit ?? DEFAULT_LIST_LIMIT, DEFAULT_LIST_LIMIT)
  const rows = input.status
    ? await db
        .select()
        .from(affiliateConversions)
        .where(eq(affiliateConversions.status, input.status))
        .orderBy(desc(affiliateConversions.createdAt))
        .limit(limit)
    : await db
        .select()
        .from(affiliateConversions)
        .orderBy(desc(affiliateConversions.createdAt))
        .limit(limit)
  return rows.map(toConversion)
}

async function getConversionById(
  input: Readonly<{ id: string }>,
): Promise<AffiliateConversionRecord | null> {
  const rows = await db
    .select()
    .from(affiliateConversions)
    .where(eq(affiliateConversions.id, input.id))
    .limit(1)
  if (!rows.length) return null
  return toConversion(rows[0]!)
}

/**
 * Aggregates
 */
async function getSummaryForCode(input: Readonly<{ code: string }>): Promise<AffiliateSummary> {
  const clicks = await db
    .select({ count: sql<number>`count(*)` })
    .from(affiliateClicks)
    .where(eq(affiliateClicks.code, input.code))
  const conv = await db
    .select({ count: sql<number>`count(*)` })
    .from(affiliateConversions)
    .where(eq(affiliateConversions.code, input.code))
  return {
    totalClicks: Number(clicks[0]?.count ?? 0),
    conversions: Number(conv[0]?.count ?? 0),
  } as const
}

const repo = {
  getByUserId,
  getByCode,
  upsertForUser,
  regenerateCode,
  createClick,
  listClicksByCode,
  markClickConverted,
  createConversion,
  getConversionByOrderId,
  listConversionsByCode,
  updateConversionStatus,
  appendConversionEvent,
  listConversionsAdmin,
  getConversionById,
  getSummaryForCode,
} as const

export default repo
