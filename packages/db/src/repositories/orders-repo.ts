import { and, desc, eq, or } from "drizzle-orm"
import { db } from "../db"
import { orderItems, orders } from "../schema/orders"

type OrderStatus = "pending" | "paid" | "shipped" | "delivered" | "cancelled"
type PaymentProvider = "stripe" | "paypal"

export interface CreateOrderItemInput {
  readonly id: string
  readonly productId?: string
  readonly name: string
  readonly priceCents: number
  readonly quantity: number
  readonly imageUrl?: string
}

export interface CreateOrderInput {
  readonly id: string
  readonly userId?: string | null
  readonly guestId?: string | null
  readonly email?: string | null
  readonly status?: OrderStatus
  readonly paymentProvider?: PaymentProvider | null
  readonly paymentRef?: string | null
  readonly subtotalCents: number
  readonly shippingCents: number
  readonly taxCents: number
  readonly totalCents: number
  /** Affiliate attribution (optional) */
  readonly affiliateCode?: string | null
  readonly affiliateClickId?: string | null
  readonly affiliateCommissionCents?: number | null
  readonly affiliateStatus?: "pending" | "approved" | "paid" | null
  readonly affiliateAttributedAt?: Date | null
  readonly items: readonly CreateOrderItemInput[]
}

export interface OrderRecord {
  readonly id: string
  readonly userId: string | null
  readonly guestId: string | null
  readonly email: string | null
  readonly subtotalCents: number
  readonly shippingCents: number
  readonly taxCents: number
  readonly totalCents: number
  readonly createdAt: Date
  readonly status: OrderStatus
  readonly paymentProvider: PaymentProvider | null
  readonly paymentRef: string | null
  readonly affiliateCode?: string | null
  readonly affiliateClickId?: string | null
  readonly affiliateCommissionCents?: number | null
  readonly affiliateStatus?: "pending" | "approved" | "paid" | null
  readonly affiliateAttributedAt?: Date | null
  readonly items: readonly {
    readonly id: string
    readonly orderId: string
    readonly productId: string | null
    readonly name: string
    readonly priceCents: number
    readonly quantity: number
    readonly imageUrl: string | null
  }[]
}

/** Orders repository */
export default {
  async create(input: CreateOrderInput): Promise<OrderRecord> {
    const base = await db
      .insert(orders)
      .values({
        id: input.id,
        userId: input.userId ?? null,
        guestId: input.guestId ?? null,
        email: input.email ?? null,
        status: input.status ?? "pending",
        paymentProvider: input.paymentProvider ?? undefined,
        paymentRef: input.paymentRef ?? undefined,
        subtotalCents: input.subtotalCents,
        shippingCents: input.shippingCents,
        taxCents: input.taxCents,
        totalCents: input.totalCents,
        affiliateCode: input.affiliateCode ?? undefined,
        affiliateClickId: input.affiliateClickId ?? undefined,
        affiliateCommissionCents: input.affiliateCommissionCents ?? undefined,
        affiliateStatus: input.affiliateStatus ?? undefined,
        affiliateAttributedAt: input.affiliateAttributedAt ?? undefined,
      })
      .returning()

    const order = base[0]
    await db.insert(orderItems).values(
      input.items.map((it) => ({
        id: it.id,
        orderId: order.id,
        productId: it.productId ?? null,
        name: it.name,
        priceCents: it.priceCents,
        quantity: it.quantity,
        imageUrl: it.imageUrl ?? null,
      })),
    )

    const items = await db.select().from(orderItems).where(eq(orderItems.orderId, order.id))
    return {
      ...order,
      status: order.status as OrderStatus,
      paymentProvider:
        (order as unknown as { paymentProvider?: PaymentProvider | null }).paymentProvider ?? null,
      paymentRef: (order as unknown as { paymentRef?: string | null }).paymentRef ?? null,
      affiliateStatus: (order as unknown as { affiliateStatus?: string | null }).affiliateStatus as
        | "pending"
        | "approved"
        | "paid"
        | null
        | undefined,
      affiliateAttributedAt: (order as unknown as { affiliateAttributedAt?: Date | null })
        .affiliateAttributedAt
        ? new Date(
            (order as unknown as { affiliateAttributedAt?: Date | null })
              .affiliateAttributedAt as Date,
          )
        : null,
      createdAt: new Date(order.createdAt),
      items,
    }
  },

  async byIdForUserOrGuest(
    id: string,
    userId?: string | null,
    guestId?: string | null,
  ): Promise<OrderRecord | null> {
    const rows = await db
      .select()
      .from(orders)
      .where(
        and(
          eq(orders.id, id),
          or(eq(orders.userId, userId ?? ""), eq(orders.guestId, guestId ?? "")),
        ),
      )
    if (rows.length === 0) return null
    const order = rows[0]
    const items = await db.select().from(orderItems).where(eq(orderItems.orderId, id))
    return {
      ...order,
      status: order.status as OrderStatus,
      paymentProvider:
        (order as unknown as { paymentProvider?: PaymentProvider | null }).paymentProvider ?? null,
      paymentRef: (order as unknown as { paymentRef?: string | null }).paymentRef ?? null,
      affiliateStatus: (order as unknown as { affiliateStatus?: string | null }).affiliateStatus as
        | "pending"
        | "approved"
        | "paid"
        | null
        | undefined,
      affiliateAttributedAt: (order as unknown as { affiliateAttributedAt?: Date | null })
        .affiliateAttributedAt
        ? new Date(
            (order as unknown as { affiliateAttributedAt?: Date | null })
              .affiliateAttributedAt as Date,
          )
        : null,
      createdAt: new Date(order.createdAt),
      items,
    }
  },

  async listForUserOrGuest(
    userId?: string | null,
    guestId?: string | null,
  ): Promise<readonly OrderRecord[]> {
    const rows = await db
      .select()
      .from(orders)
      .where(or(eq(orders.userId, userId ?? ""), eq(orders.guestId, guestId ?? "")))
      .orderBy(desc(orders.createdAt))
    const all = await Promise.all(
      rows.map(async (o) => {
        const items = await db.select().from(orderItems).where(eq(orderItems.orderId, o.id))
        return {
          ...o,
          status: o.status as OrderStatus,
          paymentProvider:
            (o as unknown as { paymentProvider?: PaymentProvider | null }).paymentProvider ?? null,
          paymentRef: (o as unknown as { paymentRef?: string | null }).paymentRef ?? null,
          affiliateStatus: (o as unknown as { affiliateStatus?: string | null }).affiliateStatus as
            | "pending"
            | "approved"
            | "paid"
            | null
            | undefined,
          affiliateAttributedAt: (o as unknown as { affiliateAttributedAt?: Date | null })
            .affiliateAttributedAt
            ? new Date(
                (o as unknown as { affiliateAttributedAt?: Date | null })
                  .affiliateAttributedAt as Date,
              )
            : null,
          createdAt: new Date(o.createdAt),
          items,
        }
      }),
    )
    return all
  },

  // Admin: list all orders (optionally by status), newest first
  async listAll(limit = 50, status?: OrderRecord["status"]): Promise<readonly OrderRecord[]> {
    const q = status
      ? db
          .select()
          .from(orders)
          .where(eq(orders.status, status))
          .orderBy(desc(orders.createdAt))
          .limit(limit)
      : db.select().from(orders).orderBy(desc(orders.createdAt)).limit(limit)
    const rows = await q
    const all = await Promise.all(
      rows.map(async (o) => {
        const items = await db.select().from(orderItems).where(eq(orderItems.orderId, o.id))
        return {
          ...o,
          status: o.status as OrderStatus,
          paymentProvider:
            (o as unknown as { paymentProvider?: PaymentProvider | null }).paymentProvider ?? null,
          paymentRef: (o as unknown as { paymentRef?: string | null }).paymentRef ?? null,
          affiliateStatus: (o as unknown as { affiliateStatus?: string | null }).affiliateStatus as
            | "pending"
            | "approved"
            | "paid"
            | null
            | undefined,
          affiliateAttributedAt: (o as unknown as { affiliateAttributedAt?: Date | null })
            .affiliateAttributedAt
            ? new Date(
                (o as unknown as { affiliateAttributedAt?: Date | null })
                  .affiliateAttributedAt as Date,
              )
            : null,
          createdAt: new Date(o.createdAt),
          items,
        }
      }),
    )
    return all
  },

  // Admin: get by id (no user/guest restriction)
  async byId(id: string): Promise<OrderRecord | null> {
    const rows = await db.select().from(orders).where(eq(orders.id, id))
    if (rows.length === 0) return null
    const o = rows[0]
    const items = await db.select().from(orderItems).where(eq(orderItems.orderId, id))
    return {
      ...o,
      status: o.status as OrderStatus,
      paymentProvider:
        (o as unknown as { paymentProvider?: PaymentProvider | null }).paymentProvider ?? null,
      paymentRef: (o as unknown as { paymentRef?: string | null }).paymentRef ?? null,
      affiliateStatus: (o as unknown as { affiliateStatus?: string | null }).affiliateStatus as
        | "pending"
        | "approved"
        | "paid"
        | null
        | undefined,
      affiliateAttributedAt: (o as unknown as { affiliateAttributedAt?: Date | null })
        .affiliateAttributedAt
        ? new Date(
            (o as unknown as { affiliateAttributedAt?: Date | null }).affiliateAttributedAt as Date,
          )
        : null,
      createdAt: new Date(o.createdAt),
      items,
    }
  },

  // Admin: update status
  async updateStatus(id: string, status: OrderRecord["status"]): Promise<OrderRecord | null> {
    const updated = await db.update(orders).set({ status }).where(eq(orders.id, id)).returning()
    if (updated.length === 0) return null
    const o = updated[0]
    const items = await db.select().from(orderItems).where(eq(orderItems.orderId, id))
    return {
      ...o,
      status: o.status as OrderStatus,
      paymentProvider:
        (o as unknown as { paymentProvider?: PaymentProvider | null }).paymentProvider ?? null,
      paymentRef: (o as unknown as { paymentRef?: string | null }).paymentRef ?? null,
      affiliateStatus: (o as unknown as { affiliateStatus?: string | null }).affiliateStatus as
        | "pending"
        | "approved"
        | "paid"
        | null
        | undefined,
      affiliateAttributedAt: (o as unknown as { affiliateAttributedAt?: Date | null })
        .affiliateAttributedAt
        ? new Date(
            (o as unknown as { affiliateAttributedAt?: Date | null }).affiliateAttributedAt as Date,
          )
        : null,
      createdAt: new Date(o.createdAt),
      items,
    }
  },

  /** Update status by paymentRef (e.g., Stripe PaymentIntent id). */
  async updateStatusByPaymentRef(
    paymentRef: string,
    status: OrderRecord["status"],
  ): Promise<OrderRecord | null> {
    const rows = await db.select().from(orders).where(eq(orders.paymentRef, paymentRef))
    if (rows.length === 0) return null
    const id = rows[0].id
    return await this.updateStatus(id, status)
  },
}
