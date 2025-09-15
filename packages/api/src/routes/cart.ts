/**
 * Cart routes for the Shop API.
 *
 * Ephemeral in-memory implementation for dev. Replace with Drizzle-based storage.
 */

import type { Context } from "hono"
import { Hono } from "hono"
import { getCookie, setCookie } from "hono/cookie"
import { z } from "zod"
import { validate } from "../lib/validate"

/**
 * Types for cart
 */
type Currency = "USD"

type CartItem = Readonly<{
  id: string // line id
  productId: string
  variantId?: string
  name: string
  price: number // cents
  quantity: number
  imageUrl?: string
  currency: Currency
}>

type Cart = Readonly<{
  id: string
  items: readonly CartItem[]
  subtotal: number
  currency: Currency
}>

/**
 * Simple in-memory cart store keyed by cartId cookie.
 * DO NOT use in production.
 */
const store = new Map<string, Cart>()

const ensureCart = (cartId: string): Cart => {
  const existing = store.get(cartId)
  if (existing) return existing
  const empty: Cart = { id: cartId, items: [], subtotal: 0, currency: "USD" } as const
  store.set(cartId, empty)
  return empty
}

const sumSubtotal = (items: readonly CartItem[]): number =>
  items.reduce((acc: number, it: CartItem) => acc + it.price * it.quantity, 0)

/**
 * Input schemas
 */
const addItemSchema = z.object({
  id: z.string().min(1).optional(),
  productId: z.string().min(1),
  variantId: z.string().min(1).optional(),
  name: z.string().min(1).max(200),
  price: z.number().int().nonnegative(),
  quantity: z.number().int().positive().max(99),
  imageUrl: z.string().url().optional(),
})

const updateItemSchema = z.object({
  quantity: z.number().int().positive().max(99),
})

const paramsSchema = z.object({ id: z.string().min(1) })

/**
 * Helpers to get/set cart via cookie
 */
const getCartId = (c: Context): string => {
  const id: string | undefined = getCookie(c, "cartId")
  if (id) return id
  const generated: string = `cart_${Math.random().toString(36).slice(2)}`
  setCookie(c, "cartId", generated, { path: "/", httpOnly: true, sameSite: "Lax" })
  return generated
}

const withUpdatedCart = (cartId: string, items: readonly CartItem[]): Cart => {
  const updated: Cart = {
    id: cartId,
    items,
    subtotal: sumSubtotal(items),
    currency: "USD",
  } as const
  store.set(cartId, updated)
  return updated
}

/**
 * Router
 */
const cartRoute = new Hono()
  // GET /api/v1/cart
  .get("/", (c: Context) => {
    const id = getCartId(c)
    const cart = ensureCart(id)
    return c.json(cart, 200)
  })
  // POST /api/v1/cart/items
  .post("/items", async (c: Context) => {
    const id = getCartId(c)
    const parsed = await validate.body(c, addItemSchema)
    const current = ensureCart(id)
    const { id: clientId, ...rest } = parsed as { readonly id?: string } & Omit<
      z.infer<typeof addItemSchema>,
      "id"
    >
    const itemId =
      clientId ?? `line_${Date.now().toString(36)}_${Math.random().toString(36).slice(2)}`
    const newItem: CartItem = {
      id: itemId,
      currency: "USD",
      ...(rest as unknown as Omit<CartItem, "id" | "currency">),
    } as const
    const items = [...current.items, newItem] as const
    const updated = withUpdatedCart(id, items)
    return c.json(updated, 201)
  })
  // PATCH /api/v1/cart/items/:id
  .patch("/items/:id", async (c: Context) => {
    const id = getCartId(c)
    const params = validate.params(c, paramsSchema)
    const parsed = await validate.body(c, updateItemSchema)
    const current = ensureCart(id)
    const items = current.items.map((it) =>
      it.id === params.id ? { ...it, quantity: parsed.quantity } : it,
    )
    const updated = withUpdatedCart(id, items)
    return c.json(updated, 200)
  })
  // DELETE /api/v1/cart/items/:id
  .delete("/items/:id", (c: Context) => {
    const id = getCartId(c)
    const params = validate.params(c, paramsSchema)
    const current = ensureCart(id)
    const items = current.items.filter((it) => it.id !== params.id)
    const updated = withUpdatedCart(id, items)
    return c.json(updated, 200)
  })

export default cartRoute
