import { createHash } from "node:crypto"
import { affiliateRepo, idempotencyRepo, inventoryRepo, ordersRepo } from "@repo/db"
import type { Context } from "hono"
import { Hono } from "hono"
import { z } from "zod"
import { apiEnv } from "../env"
import { AdminGuard } from "../lib/admin-guard"
import { calculateCommissionCents } from "../lib/commission"
import { computeTotals } from "../lib/totals"
import { transactionalEmail } from "../lib/transactional-email"
import { validate } from "../lib/validate"

/** DTOs used over the wire */
interface OrderItemDto {
  readonly id: string
  readonly productId?: string
  readonly name: string
  readonly price: number
  readonly quantity: number
  readonly imageUrl?: string
}
interface OrderDto {
  readonly id: string
  readonly createdAt: string
  readonly email?: string
  readonly status: "pending" | "paid" | "shipped" | "delivered" | "cancelled"
  readonly paymentProvider?: "stripe" | "paypal"
  readonly paymentRef?: string
  readonly items: readonly OrderItemDto[]
  readonly subtotal: number
  readonly shipping: number
  readonly tax: number
  readonly total: number
  readonly shippingAddress?: Readonly<{
    country?: string
    state?: string
    city?: string
    zipCode?: string
  }>
}

const COOKIE = "orderUserId" as const
const AFF_COOKIE = "AFF_REF" as const

function getOrSetGuestId(c: Context): string {
  const cookie = c.req.header("cookie") ?? ""
  const match = cookie.match(/(?:^|;\s*)orderUserId=([^;]+)/)
  if (match) return decodeURIComponent(match[1])
  const id = crypto.randomUUID()
  c.header(
    "Set-Cookie",
    `${COOKIE}=${encodeURIComponent(id)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${60 * 60 * 24 * 30}`,
  )
  return id
}

function toCents(n: number): number {
  return Math.round(n * 100)
}
function fromCents(n: number): number {
  return Math.round(n) / 100
}

function readCookie(header: string | null, name: string): string | null {
  const cookie: string = header ?? ""
  const parts: readonly string[] = cookie.split("; ")
  for (const e of parts) {
    if (!e) continue
    const i: number = e.indexOf("=")
    if (i === -1) continue
    if (e.slice(0, i) !== name) continue
    try {
      return decodeURIComponent(e.slice(i + 1))
    } catch {
      return e.slice(i + 1)
    }
  }
  return null
}

function toDto(rec: Awaited<ReturnType<typeof ordersRepo.byIdForUserOrGuest>>): OrderDto | null {
  if (!rec) return null
  return {
    id: rec.id,
    createdAt: rec.createdAt.toISOString(),
    email: rec.email ?? undefined,
    status: rec.status,
    paymentProvider: rec.paymentProvider ?? undefined,
    paymentRef: rec.paymentRef ?? undefined,
    items: rec.items.map((it) => ({
      id: it.id,
      productId: it.productId ?? undefined,
      name: it.name,
      price: fromCents(it.priceCents),
      quantity: it.quantity,
      imageUrl: it.imageUrl ?? undefined,
    })),
    subtotal: fromCents(rec.subtotalCents),
    shipping: fromCents(rec.shippingCents),
    tax: fromCents(rec.taxCents),
    total: fromCents(rec.totalCents),
  }
}

const IDEM_SCOPE_ORDERS: string = "orders/create"

function stableStringify(obj: unknown): string {
  const seen = new WeakSet<object>()
  const replacer = (_k: string, v: unknown): unknown => {
    if (v && typeof v === "object") {
      if (seen.has(v as object)) return undefined
      seen.add(v as object)
      const entries = Object.entries(v as Record<string, unknown>).sort(([a], [b]) =>
        a < b ? -1 : a > b ? 1 : 0,
      )
      return entries.reduce<Record<string, unknown>>((acc, [k, val]) => {
        acc[k] = val
        return acc
      }, {})
    }
    return v
  }
  return JSON.stringify(obj, replacer)
}

function sha256Hex(input: string): string {
  return createHash("sha256").update(input).digest("hex")
}

// Zod schemas for request validation
const orderItemSchema = z.object({
  id: z.string().min(1).optional(),
  productId: z.string().min(1).optional(),
  name: z.string().trim().min(1),
  price: z.number(),
  quantity: z.number().int().positive(),
  imageUrl: z.string().url().optional(),
})
const addressSchema = z
  .object({
    country: z.string().optional(),
    state: z.string().optional(),
    city: z.string().optional(),
    zipCode: z.string().optional(),
  })
  .partial()
const orderBodySchema = z.object({
  items: z.array(orderItemSchema).nonempty(),
  email: z.string().email().optional(),
  status: z.enum(["pending", "paid"]).default("pending"),
  paymentProvider: z.enum(["stripe", "paypal"]).optional(),
  paymentRef: z.string().max(200).optional(),
  shippingAddress: addressSchema.optional(),
})
type OrderCreateBody = Readonly<z.infer<typeof orderBodySchema>>

const route = new Hono()
  .post("/", async (c) => {
    const guestId = getOrSetGuestId(c)
    const user = AdminGuard.getUser(c) as { id?: string | null; email?: string | null } | null
    const userId = user?.id ?? null
    const body: OrderCreateBody = await validate.body(c, orderBodySchema)
    const idemKey: string | undefined =
      c.req.header("Idempotency-Key") ?? c.req.header("idempotency-key") ?? undefined
    const requestHash: string = sha256Hex(stableStringify(body))
    if (idemKey) {
      const existing = await idempotencyRepo.getByKeyScope(idemKey, IDEM_SCOPE_ORDERS)
      if (existing) {
        if (existing.requestHash !== requestHash) {
          return c.json({ message: "Idempotency key reuse with different payload" }, 409)
        }
        const prev = JSON.parse(existing.responseJson) as OrderDto
        c.status(200)
        return c.json(prev)
      }
    }
    const id = `ord_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`
    // Compute trusted totals server-side
    const itemsInput = body.items.map((it) => ({
      productId: it.productId,
      priceCents: toCents(it.price),
      quantity: it.quantity,
    }))
    const destination = body.shippingAddress
      ? {
          country: body.shippingAddress.country,
          state: body.shippingAddress.state,
          city: body.shippingAddress.city,
          zipCode: body.shippingAddress.zipCode,
        }
      : undefined
    const totals = await computeTotals({ items: itemsInput, destination })
    const subtotalCents = totals.subtotalCents
    const refCode = readCookie(c.req.header("cookie") ?? null, AFF_COOKIE)
    const latestClick = refCode
      ? (await affiliateRepo.listClicksByCode({ code: refCode, limit: 1 }))[0]
      : undefined
    const commissionCents = refCode
      ? calculateCommissionCents({ subtotalCents, pct: apiEnv.AFFILIATE_COMMISSION_PCT })
      : 0
    if (refCode)
      console.log("[orders] affiliate attribution", {
        refCode,
        clickId: latestClick?.id ?? null,
        commissionCents,
        orderId: id,
      })
    // Reserve inventory for items that are inventory-tracked (presence of inventory row). Missing rows are treated as untracked.
    try {
      const reserveItems = body.items
        .filter((it) => Boolean(it.productId) && it.quantity > 0)
        .map((it) => ({ productId: it.productId as string, qty: it.quantity }))
      await inventoryRepo.reserveForOrder(id, reserveItems)
    } catch (err) {
      const message: string = err instanceof Error ? err.message : String(err)
      if (message.startsWith("OUT_OF_STOCK:")) {
        const productId = message.split(":")[1] ?? "unknown"
        return c.json({ message: "Out of stock", productId }, 409)
      }
      return c.json({ message: "Failed to reserve inventory" }, 500)
    }
    const desiredStatus: "pending" | "paid" = body.status === "paid" ? "paid" : "pending"
    let created: Awaited<ReturnType<typeof ordersRepo.create>>
    try {
      created = await ordersRepo.create({
        id,
        userId,
        guestId,
        email: body.email ?? user?.email ?? null,
        status: desiredStatus,
        paymentProvider: body.paymentProvider ?? null,
        paymentRef: body.paymentRef ?? null,
        subtotalCents: totals.subtotalCents,
        shippingCents: totals.shippingCents,
        taxCents: totals.taxCents,
        totalCents: totals.totalCents,
        affiliateCode: refCode ?? null,
        affiliateClickId: latestClick?.id ?? null,
        affiliateCommissionCents: commissionCents,
        affiliateStatus: refCode ? "pending" : null,
        affiliateAttributedAt: refCode ? new Date() : null,
        items: body.items.map((it) => ({
          id: it.id ?? `oi_${Math.random().toString(36).slice(2, 10)}`,
          productId: it.productId,
          name: it.name,
          priceCents: toCents(it.price),
          quantity: it.quantity,
          imageUrl: it.imageUrl,
        })),
      })
    } catch (err) {
      // Roll back reservations if order creation fails
      try {
        await inventoryRepo.releaseOrder(id)
      } catch {}
      const message: string = err instanceof Error ? err.message : "Failed to create order"
      return c.json({ message }, 500)
    }
    if (desiredStatus === "paid") {
      try {
        await inventoryRepo.commitOrder(created.id)
      } catch {}
      try {
        if (created.email)
          await transactionalEmail.orderPaid({
            email: created.email,
            orderId: created.id,
            totalCents: created.totalCents,
          })
      } catch {}
    } else {
      try {
        if (created.email)
          await transactionalEmail.orderCreated({
            email: created.email,
            orderId: created.id,
            totalCents: created.totalCents,
          })
      } catch {}
    }
    if (refCode && latestClick) {
      try {
        const conv = await affiliateRepo.createConversion({
          clickId: latestClick.id,
          orderId: created.id,
          userId: userId ?? null,
          code: refCode,
          commissionCents,
          status: "pending",
        })
        await affiliateRepo.markClickConverted({ clickId: latestClick.id })
        console.log("[orders] affiliate conversion created", {
          conversionId: conv.id,
          orderId: created.id,
          clickId: latestClick.id,
        })
      } catch (err) {
        console.error("[orders] affiliate conversion side-effect failed", {
          orderId: created.id,
          clickId: latestClick.id,
          error: err instanceof Error ? err.message : String(err),
        })
        // do not block order creation on affiliate side-effects
      }
    }
    const dto = toDto(created)!
    if (idemKey) {
      try {
        await idempotencyRepo.create({
          key: idemKey,
          scope: IDEM_SCOPE_ORDERS,
          requestHash,
          responseJson: JSON.stringify(dto),
          status: 201,
        })
      } catch {
        // ignore unique conflict; best-effort persistence
      }
    }
    return c.json(dto, 201)
  })
  .get("/", async (c) => {
    const guestId = getOrSetGuestId(c)
    const user = AdminGuard.getUser(c) as { id?: string | null } | null
    const list = await ordersRepo.listForUserOrGuest(user?.id ?? null, guestId)
    const out: readonly OrderDto[] = list.map((rec) => toDto(rec)!).filter(Boolean) as OrderDto[]
    return c.json(out, 200)
  })
  .get("/:id", async (c) => {
    const guestId = getOrSetGuestId(c)
    const user = AdminGuard.getUser(c) as { id?: string | null } | null
    const idParams = z.object({ id: z.string().min(1) })
    const { id } = validate.params(c, idParams)
    const rec = await ordersRepo.byIdForUserOrGuest(id, user?.id ?? null, guestId)
    const dto = toDto(rec)
    if (!dto) return c.json({ message: "Not found" }, 404)
    return c.json(dto, 200)
  })

export default route
