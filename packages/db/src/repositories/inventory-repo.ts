import { randomUUID } from "node:crypto"
import { and, eq, gte, sql } from "drizzle-orm"
import { db } from "../db"
import { inventory } from "../schema/inventory"
import { inventoryReservations } from "../schema/inventory-reservations"

/**
 * Inventory repository for stock and reservation management.
 */
export type ReserveItem = Readonly<{ productId: string; qty: number }>

function now(): Date {
  return new Date()
}

async function getStock(productId: string): Promise<number> {
  const rows = await db.select().from(inventory).where(eq(inventory.productId, productId)).limit(1)
  if (!rows.length) return 0
  return rows[0].stockQty ?? 0
}

async function setStock(productId: string, qty: number): Promise<void> {
  const rows = await db.select().from(inventory).where(eq(inventory.productId, productId)).limit(1)
  if (!rows.length) {
    await db
      .insert(inventory)
      .values({ productId, stockQty: Math.max(0, qty), updatedAt: now() })
      .returning()
    return
  }
  await db
    .update(inventory)
    .set({ stockQty: Math.max(0, qty), updatedAt: now() })
    .where(eq(inventory.productId, productId))
}

async function reserveForOrder(orderId: string, items: readonly ReserveItem[]): Promise<void> {
  if (!items.length) return
  await db.transaction(async (tx) => {
    for (const it of items) {
      if (!it.productId || it.qty <= 0) continue
      // Treat absence of inventory row as untracked (skip reservation)
      const exists = await tx
        .select()
        .from(inventory)
        .where(eq(inventory.productId, it.productId))
        .limit(1)
      if (!exists.length) continue
      const updated = await tx
        .update(inventory)
        .set({ stockQty: sql`${inventory.stockQty} - ${it.qty}`, updatedAt: now() })
        .where(and(eq(inventory.productId, it.productId), gte(inventory.stockQty, it.qty)))
        .returning()
      if (!updated.length) throw new Error(`OUT_OF_STOCK:${it.productId}`)
      await tx.insert(inventoryReservations).values({
        id: `res_${randomUUID()}`,
        orderId,
        productId: it.productId,
        qty: it.qty,
        status: "reserved",
        createdAt: now(),
        updatedAt: now(),
      })
    }
  })
}

async function listReservationsByOrder(
  orderId: string,
): Promise<readonly { id: string; productId: string; qty: number; status: string }[]> {
  const rows = await db
    .select()
    .from(inventoryReservations)
    .where(eq(inventoryReservations.orderId, orderId))
  return rows.map((r) => ({ id: r.id, productId: r.productId, qty: r.qty, status: r.status }))
}

async function commitOrder(orderId: string): Promise<void> {
  await db
    .update(inventoryReservations)
    .set({ status: "committed", updatedAt: now() })
    .where(eq(inventoryReservations.orderId, orderId))
}

async function releaseOrder(orderId: string): Promise<void> {
  await db.transaction(async (tx) => {
    const rows = await tx
      .select()
      .from(inventoryReservations)
      .where(eq(inventoryReservations.orderId, orderId))
    for (const r of rows) {
      if (r.status !== "reserved") continue
      await tx
        .update(inventory)
        .set({ stockQty: sql`${inventory.stockQty} + ${r.qty}`, updatedAt: now() })
        .where(eq(inventory.productId, r.productId))
    }
    await tx
      .update(inventoryReservations)
      .set({ status: "released", updatedAt: now() })
      .where(eq(inventoryReservations.orderId, orderId))
  })
}

async function restockOrder(orderId: string): Promise<void> {
  await db.transaction(async (tx) => {
    const rows = await tx
      .select()
      .from(inventoryReservations)
      .where(eq(inventoryReservations.orderId, orderId))
    for (const r of rows) {
      // For refunds or cancellations after commit, add back regardless of prior status (reserved/committed)
      if (r.status === "released") continue
      await tx
        .update(inventory)
        .set({ stockQty: sql`${inventory.stockQty} + ${r.qty}`, updatedAt: now() })
        .where(eq(inventory.productId, r.productId))
    }
    await tx
      .update(inventoryReservations)
      .set({ status: "released", updatedAt: now() })
      .where(eq(inventoryReservations.orderId, orderId))
  })
}

const inventoryRepo = {
  getStock,
  setStock,
  reserveForOrder,
  listReservationsByOrder,
  commitOrder,
  releaseOrder,
  restockOrder,
} as const

export default inventoryRepo
