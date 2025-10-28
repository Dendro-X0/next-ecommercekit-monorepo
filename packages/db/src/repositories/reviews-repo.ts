import { randomUUID } from "node:crypto"
/**
 * Reviews repository
 */
import { and, desc, eq } from "drizzle-orm"
import { db } from "../db"
import { reviews } from "../schema/reviews"

export type ReviewRecord = Readonly<{
  id: string
  userId: string | null
  productId: string
  rating: number // 1..5
  title: string | null
  content: string | null
  status: "Pending" | "Published" | "Rejected"
  createdAt: string // ISO
  updatedAt: string // ISO
}>

export type CreateReviewInput = Readonly<{
  userId: string | null
  productId: string
  rating: number
  title?: string
  content?: string
}>

export type UpdateReviewInput = Readonly<{
  rating?: number
  title?: string | null
  content?: string | null
}>

type ReviewRow = typeof reviews.$inferSelect

/** Map db row to DTO */
function mapRow(r: ReviewRow): ReviewRecord {
  return {
    id: r.id,
    userId: r.userId ?? null,
    productId: r.productId,
    rating: Number(r.rating ?? 0),
    title: r.title ?? null,
    content: r.content ?? null,
    status: r.status as unknown as ReviewRecord["status"],
    createdAt: (r.createdAt as Date).toISOString(),
    updatedAt: (r.updatedAt as Date).toISOString(),
  } as const
}

/** Create a review */
async function create(input: CreateReviewInput): Promise<ReviewRecord> {
  const id = randomUUID()
  await db.insert(reviews).values({
    id,
    userId: input.userId ?? undefined,
    productId: input.productId,
    rating: input.rating,
    title: input.title,
    content: input.content,
    status: "Pending",
  })
  const [row] = await db.select().from(reviews).where(eq(reviews.id, id)).limit(1)
  return mapRow(row)
}

/** Get a review by id */
async function byId(id: string): Promise<ReviewRecord | null> {
  const rows = await db.select().from(reviews).where(eq(reviews.id, id)).limit(1)
  return rows.length ? mapRow(rows[0]) : null
}

/** List reviews authored by user */
async function listByUser(userId: string, limit = 100): Promise<readonly ReviewRecord[]> {
  const rows = await db
    .select()
    .from(reviews)
    .where(eq(reviews.userId, userId))
    .orderBy(desc(reviews.createdAt))
    .limit(limit)
  return rows.map(mapRow)
}

/** List published reviews for a product */
async function listByProduct(productId: string, limit = 100): Promise<readonly ReviewRecord[]> {
  const rows = await db
    .select()
    .from(reviews)
    .where(and(eq(reviews.productId, productId), eq(reviews.status, "Published")))
    .orderBy(desc(reviews.createdAt))
    .limit(limit)
  return rows.map(mapRow)
}

/** Update own review (title/content/rating) */
async function update(id: string, patch: UpdateReviewInput): Promise<ReviewRecord | null> {
  await db
    .update(reviews)
    .set({
      rating: patch.rating as number | undefined,
      title: patch.title as string | undefined,
      content: patch.content as string | undefined,
      updatedAt: new Date(),
    })
    .where(eq(reviews.id, id))
  const rows = await db.select().from(reviews).where(eq(reviews.id, id)).limit(1)
  return rows.length ? mapRow(rows[0]) : null
}

/** Delete review */
async function remove(id: string): Promise<boolean> {
  const _res = await db.delete(reviews).where(eq(reviews.id, id))
  // Drizzle doesn't return affected rows reliably; re-check
  const row = await byId(id)
  return !row
}

/** Admin: list reviews with optional filters */
export type AdminListQuery = Readonly<{
  status?: "Pending" | "Published" | "Rejected"
  productId?: string
  userId?: string
  limit?: number
}>

async function adminList(query: AdminListQuery): Promise<readonly ReviewRecord[]> {
  const conds = [] as Array<ReturnType<typeof eq>>
  if (query.status) conds.push(eq(reviews.status, query.status))
  if (query.productId) conds.push(eq(reviews.productId, query.productId))
  if (query.userId) conds.push(eq(reviews.userId, query.userId))
  const base = db.select().from(reviews)
  const q = conds.length > 0 ? base.where(and(...conds)) : base
  const rows = await q.orderBy(desc(reviews.createdAt)).limit(query.limit ?? 200)
  return rows.map(mapRow)
}

/** Admin: update review status */
async function adminUpdateStatus(
  id: string,
  status: "Pending" | "Published" | "Rejected",
): Promise<ReviewRecord | null> {
  await db.update(reviews).set({ status, updatedAt: new Date() }).where(eq(reviews.id, id))
  const rows = await db.select().from(reviews).where(eq(reviews.id, id)).limit(1)
  return rows.length ? mapRow(rows[0]) : null
}

const repo = {
  create,
  byId,
  listByUser,
  listByProduct,
  update,
  remove,
  adminList,
  adminUpdateStatus,
} as const
export default repo
