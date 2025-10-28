import type { Product } from "@/types"
import type { CartItem } from "@/types/cart"

/** Determine if a product should be treated as digital. */
export function isDigitalProduct(product: Product): boolean {
  if (product.kind === "digital") return true
  if (product.kind === "physical") return false
  // Fallback heuristic if kind is not set
  return Array.isArray(product.tags) && product.tags.map((t) => t.toLowerCase()).includes("digital")
}

/** True if the cart has at least one digital item. */
export function hasDigitalItems(items: ReadonlyArray<CartItem>): boolean {
  return items.some((i) => isDigitalProduct(i.product))
}

/** True if the cart has at least one physical item. */
export function hasPhysicalItems(items: ReadonlyArray<CartItem>): boolean {
  return items.some((i) => !isDigitalProduct(i.product))
}

/** True if cart contains only digital items (no physical). */
export function isDigitalOnlyCart(items: ReadonlyArray<CartItem>): boolean {
  return hasDigitalItems(items) && !hasPhysicalItems(items)
}

/** True if cart contains both digital and physical items. */
export function isMixedCart(items: ReadonlyArray<CartItem>): boolean {
  return hasDigitalItems(items) && hasPhysicalItems(items)
}
