import { wishlistsRepo } from "@repo/db"
import type { Context } from "hono"
import { Hono } from "hono"
import { z } from "zod"
import { AdminGuard } from "../lib/admin-guard"
import { validate } from "../lib/validate"

interface WishlistItemDto {
  readonly id: string
  readonly productId: string
  readonly name: string
  readonly price: number
  readonly image?: string
  readonly inStock: boolean
  readonly addedAt: string
}
interface WishlistDto {
  readonly id: string
  readonly name: string
  readonly isPublic: boolean
  readonly createdAt: string
  readonly items: readonly WishlistItemDto[]
}

const COOKIE = "orderUserId" as const // reuse guest id cookie used by orders
const wishlistBodySchema = z.object({ productId: z.string().min(1) })
const wishlistBulkSchema = z.object({ productIds: z.array(z.string().min(1)).max(100) })
const productIdParamsSchema = z.object({ productId: z.string().min(1) })

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

const route = new Hono()
  .get("/", async (c) => {
    const guestId = getOrSetGuestId(c)
    const user = AdminGuard.getUser(c) as { id?: string | null } | null
    const wl = await wishlistsRepo.list({ userId: user?.id ?? null, guestId })
    return c.json(wl as WishlistDto, 200)
  })
  .post("/items", async (c) => {
    const { productId } = await validate.body(c, wishlistBodySchema)
    const guestId = getOrSetGuestId(c)
    const user = AdminGuard.getUser(c) as { id?: string | null } | null
    await wishlistsRepo.addItem({ userId: user?.id ?? null, guestId }, productId)
    return c.json({ ok: true }, 201)
  })
  .delete("/items/:productId", async (c) => {
    const { productId } = validate.params(c, productIdParamsSchema)
    const guestId = getOrSetGuestId(c)
    const user = AdminGuard.getUser(c) as { id?: string | null } | null
    await wishlistsRepo.removeItem({ userId: user?.id ?? null, guestId }, productId)
    return c.body(null, 204)
  })
  .post("/toggle", async (c) => {
    const { productId } = await validate.body(c, wishlistBodySchema)
    const guestId = getOrSetGuestId(c)
    const user = AdminGuard.getUser(c) as { id?: string | null } | null
    const added = await wishlistsRepo.toggleItem({ userId: user?.id ?? null, guestId }, productId)
    return c.json({ added }, 200)
  })
  .get("/has/:productId", async (c) => {
    const { productId } = validate.params(c, productIdParamsSchema)
    const guestId = getOrSetGuestId(c)
    const user = AdminGuard.getUser(c) as { id?: string | null } | null
    const has = await wishlistsRepo.hasItem({ userId: user?.id ?? null, guestId }, productId)
    return c.json({ has }, 200)
  })
  .post("/has/bulk", async (c) => {
    const { productIds } = await validate.body(c, wishlistBulkSchema)
    const guestId = getOrSetGuestId(c)
    const user = AdminGuard.getUser(c) as { id?: string | null } | null
    const map = await wishlistsRepo.hasItemsBulk({ userId: user?.id ?? null, guestId }, productIds)
    return c.json(map, 200)
  })

export default route
