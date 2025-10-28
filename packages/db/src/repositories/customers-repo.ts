import { count, desc, eq, ilike, or, sql, type SQL } from "drizzle-orm"
import { db } from "../db"
import { user } from "../schema/auth"
import { orders } from "../schema/orders"

/**
 * Customers repository (admin-facing aggregates)
 * One export per file: default repo object.
 */

export type ListCustomersQuery = Readonly<{
  query?: string
  limit?: number
  page?: number
}>

export type AdminCustomerRecord = Readonly<{
  id: string
  name: string
  email: string
  imageUrl?: string
  createdAt: string // ISO
  ordersCount: number
  totalSpentCents: number
  status: "Active" | "Inactive" | "VIP"
}>

const VIP_THRESHOLD_CENTS = 100_000 as const // $1,000

function pickStatus(totalSpentCents: number, ordersCount: number): AdminCustomerRecord["status"] {
  if (totalSpentCents >= VIP_THRESHOLD_CENTS) return "VIP"
  return ordersCount > 0 ? "Active" : "Inactive"
}

async function list(query: ListCustomersQuery = {}): Promise<readonly AdminCustomerRecord[]> {
  const take: number = Math.min(200, Math.max(1, query.limit ?? 50))
  const page: number = Math.max(1, query.page ?? 1)
  const skip: number = (page - 1) * take
  const where: SQL | undefined = (() => {
    const q = query.query?.trim()
    if (!q) return undefined
    return or(ilike(user.name, `%${q}%`), ilike(user.email, `%${q}%`))
  })()

  const rows = await db
    .select({
      id: user.id,
      name: user.name,
      email: user.email,
      imageUrl: user.image,
      createdAt: user.createdAt,
      ordersCount: count(orders.id).as("orders_count"),
      totalSpentCents: sql<number>`COALESCE(SUM(${orders.totalCents}), 0)`,
    })
    .from(user)
    .leftJoin(orders, eq(orders.userId, user.id))
    .where(where)
    .groupBy(user.id, user.name, user.email, user.image, user.createdAt)
    .orderBy(desc(user.createdAt), desc(user.id))
    .limit(take)
    .offset(skip)

  type Row = Readonly<{
    id: unknown
    name: unknown
    email: unknown
    imageUrl?: unknown
    createdAt: unknown
    ordersCount: unknown
    totalSpentCents: unknown
  }>

  const toStringSafe = (v: unknown, fallback = ""): string => {
    if (typeof v === "string") return v
    if (v == null) return fallback
    return String(v)
  }
  const toOptionalString = (v: unknown): string | undefined => {
    const s = typeof v === "string" ? v : v == null ? undefined : String(v)
    return s && s.trim().length > 0 ? s : undefined
  }
  const toNumberSafe = (v: unknown): number => {
    const n = typeof v === "number" ? v : Number(v)
    return Number.isFinite(n) ? n : 0
  }
  const toIsoDate = (v: unknown): string => {
    if (v instanceof Date) return v.toISOString()
    const s = toStringSafe(v)
    const d = new Date(s)
    return Number.isFinite(d.getTime()) ? d.toISOString() : new Date().toISOString()
  }

  return (rows as unknown as readonly Row[]).map((r: Row) => {
    const id: string = toStringSafe(r.id)
    const name: string = toStringSafe(r.name)
    const email: string = toStringSafe(r.email)
    const imageUrl: string | undefined = toOptionalString(r.imageUrl)
    const createdAt: string = toIsoDate(r.createdAt)
    const ordersCountNum: number = toNumberSafe(r.ordersCount)
    const totalSpent: number = toNumberSafe(r.totalSpentCents)
    return {
      id,
      name,
      email,
      imageUrl,
      createdAt,
      ordersCount: ordersCountNum,
      totalSpentCents: totalSpent,
      status: pickStatus(totalSpent, ordersCountNum),
    } as const
  })
}

const repo = { list } as const
export default repo
