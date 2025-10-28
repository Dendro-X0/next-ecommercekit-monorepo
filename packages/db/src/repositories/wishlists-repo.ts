import { randomUUID } from "node:crypto"
import { and, desc, eq, inArray, isNull } from "drizzle-orm"
import { db } from "../db"
import { products } from "../schema/products"
import { wishlistItems, wishlists } from "../schema/wishlists"

export type WishlistRecord = Readonly<{
  id: string
  userId: string | null
  guestId: string | null
  name: string
  isPublic: boolean
  createdAt: Date
}>

export type WishlistItemRecord = Readonly<{
  id: string
  wishlistId: string
  productId: string
  addedAt: Date
}>

export type WishlistItemDTO = Readonly<{
  id: string
  productId: string
  name: string
  price: number // dollars
  image?: string
  inStock: boolean
  addedAt: string
}>

export type WishlistDTO = Readonly<{
  id: string
  name: string
  isPublic: boolean
  createdAt: string
  items: readonly WishlistItemDTO[]
}>

function toIso(v: unknown): string {
  if (v instanceof Date) return v.toISOString()
  const s = typeof v === "string" ? v : String(v)
  const d = new Date(s)
  return Number.isFinite(d.getTime()) ? d.toISOString() : new Date().toISOString()
}

function fromCents(n: number): number {
  return Math.round(n) / 100
}

function ownerWhere(owner: Readonly<{ userId: string | null; guestId: string | null }>) {
  const userCond = owner.userId ? eq(wishlists.userId, owner.userId) : isNull(wishlists.userId)
  const guestCond = owner.guestId ? eq(wishlists.guestId, owner.guestId) : isNull(wishlists.guestId)
  return and(userCond, guestCond)
}

async function getOrCreate(
  owner: Readonly<{ userId: string | null; guestId: string | null }>,
): Promise<WishlistRecord> {
  const { userId, guestId } = owner
  const existing = await db.select().from(wishlists).where(ownerWhere(owner)).limit(1)
  if (existing.length) {
    const w = existing[0]
    return {
      id: w.id,
      userId: w.userId ?? null,
      guestId: w.guestId ?? null,
      name: w.name,
      isPublic: !!w.isPublic,
      createdAt: w.createdAt,
    }
  }
  const id = randomUUID()
  await db.insert(wishlists).values({
    id,
    userId: userId ?? undefined,
    guestId: guestId ?? undefined,
    name: "My Wishlist",
    isPublic: false,
  })
  const rows = await db.select().from(wishlists).where(eq(wishlists.id, id)).limit(1)
  const w = rows[0]!
  return {
    id: w.id,
    userId: w.userId ?? null,
    guestId: w.guestId ?? null,
    name: w.name,
    isPublic: !!w.isPublic,
    createdAt: w.createdAt,
  }
}

async function list(
  owner: Readonly<{ userId: string | null; guestId: string | null }>,
): Promise<WishlistDTO> {
  const w = await getOrCreate(owner)
  const rows = await db
    .select({
      id: wishlistItems.id,
      productId: wishlistItems.productId,
      addedAt: wishlistItems.addedAt,
      name: products.name,
      priceCents: products.priceCents,
      imageUrl: products.imageUrl,
    })
    .from(wishlistItems)
    .leftJoin(products, eq(products.id, wishlistItems.productId))
    .where(eq(wishlistItems.wishlistId, w.id))
    .orderBy(desc(wishlistItems.addedAt))
  const items: readonly WishlistItemDTO[] = rows.map((r) => ({
    id: r.id,
    productId: r.productId,
    name: r.name ?? "Unknown",
    price: fromCents(r.priceCents ?? 0),
    image: r.imageUrl ?? undefined,
    inStock: true,
    addedAt: toIso(r.addedAt),
  }))
  return {
    id: w.id,
    name: w.name,
    isPublic: w.isPublic,
    createdAt: w.createdAt.toISOString(),
    items,
  } as const
}

async function addItem(
  owner: Readonly<{ userId: string | null; guestId: string | null }>,
  productId: string,
): Promise<void> {
  const w = await getOrCreate(owner)
  const exists = await db
    .select({ id: wishlistItems.id })
    .from(wishlistItems)
    .where(and(eq(wishlistItems.wishlistId, w.id), eq(wishlistItems.productId, productId)))
    .limit(1)
  if (exists.length) return
  await db.insert(wishlistItems).values({ id: randomUUID(), wishlistId: w.id, productId })
}

async function removeItem(
  owner: Readonly<{ userId: string | null; guestId: string | null }>,
  productId: string,
): Promise<void> {
  const w = await getOrCreate(owner)
  await db
    .delete(wishlistItems)
    .where(and(eq(wishlistItems.wishlistId, w.id), eq(wishlistItems.productId, productId)))
}

async function toggleItem(
  owner: Readonly<{ userId: string | null; guestId: string | null }>,
  productId: string,
): Promise<boolean> {
  const w = await getOrCreate(owner)
  const exists = await db
    .select({ id: wishlistItems.id })
    .from(wishlistItems)
    .where(and(eq(wishlistItems.wishlistId, w.id), eq(wishlistItems.productId, productId)))
    .limit(1)
  if (exists.length) {
    await db.delete(wishlistItems).where(eq(wishlistItems.id, exists[0].id))
    return false
  }
  await db.insert(wishlistItems).values({ id: randomUUID(), wishlistId: w.id, productId })
  return true
}

async function hasItem(
  owner: Readonly<{ userId: string | null; guestId: string | null }>,
  productId: string,
): Promise<boolean> {
  const w = await getOrCreate(owner)
  const exists = await db
    .select({ id: wishlistItems.id })
    .from(wishlistItems)
    .where(and(eq(wishlistItems.wishlistId, w.id), eq(wishlistItems.productId, productId)))
    .limit(1)
  return exists.length > 0
}

async function hasItemsBulk(
  owner: Readonly<{ userId: string | null; guestId: string | null }>,
  productIds: readonly string[],
): Promise<Readonly<Record<string, boolean>>> {
  if (!productIds.length) return {}
  const w = await getOrCreate(owner)
  const rows = await db
    .select({ productId: wishlistItems.productId })
    .from(wishlistItems)
    .where(
      and(
        eq(wishlistItems.wishlistId, w.id),
        inArray(wishlistItems.productId, productIds as string[]),
      ),
    )
  const set = new Set(rows.map((r) => r.productId))
  const result: Record<string, boolean> = {}
  for (const id of productIds) result[id] = set.has(id)
  return result
}

const repo = { getOrCreate, list, addItem, removeItem, toggleItem, hasItem, hasItemsBulk } as const
export default repo
