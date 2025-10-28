import type { Wishlist } from "@/types/user"

/**
 * Typed client for wishlist APIs.
 */
const base = "/api/v1/wishlist" as const

async function getWishlist(): Promise<Wishlist> {
  const res = await fetch(base, { credentials: "include" })
  if (!res.ok) throw new Error(`Failed to fetch wishlist (${res.status})`)
  return (await res.json()) as Wishlist
}

async function add(productId: string): Promise<void> {
  const res = await fetch(`${base}/items`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ productId }),
  })
  if (!res.ok) throw new Error(`Failed to add to wishlist (${res.status})`)
}

async function remove(productId: string): Promise<void> {
  const res = await fetch(`${base}/items/${encodeURIComponent(productId)}`, {
    method: "DELETE",
    credentials: "include",
  })
  if (!res.ok && res.status !== 204)
    throw new Error(`Failed to remove from wishlist (${res.status})`)
}

async function toggle(productId: string): Promise<boolean> {
  const res = await fetch(`${base}/toggle`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ productId }),
  })
  if (!res.ok) throw new Error(`Failed to toggle wishlist (${res.status})`)
  const data = (await res.json()) as { added: boolean }
  return data.added
}

async function has(productId: string): Promise<boolean> {
  const res = await fetch(`${base}/has/${encodeURIComponent(productId)}`, {
    credentials: "include",
  })
  if (!res.ok) throw new Error(`Failed to query wishlist (${res.status})`)
  const data = (await res.json()) as { has: boolean }
  return data.has
}

async function hasBulk(productIds: readonly string[]): Promise<Readonly<Record<string, boolean>>> {
  const res = await fetch(`${base}/has/bulk`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ productIds }),
  })
  if (!res.ok) throw new Error(`Failed to query wishlist bulk (${res.status})`)
  const data = (await res.json()) as Readonly<Record<string, boolean>>
  return data
}

export const wishlistApi = { getWishlist, add, remove, toggle, has, hasBulk } as const
export type WishlistApi = typeof wishlistApi
