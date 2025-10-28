"use client"

import { create } from "zustand"
import { persist } from "zustand/middleware"
import { FLAT_SHIPPING_FEE, FREE_SHIPPING_THRESHOLD, TAX_RATE } from "@/lib/cart/constants"
import { CART_QK } from "@/lib/cart/query-keys"
import { cartApi } from "@/lib/data/cart"
import { queryClient } from "@/lib/query-client"
import type { Product } from "@/types"
import type { Cart, CartItem } from "@/types/cart"

/**
 * Compare two arrays of cart items for shallow equality by id, product.id and quantity.
 * Keeps functions small and single-purpose per user rules.
 */
function cartItemsEqual(a: readonly CartItem[], b: readonly CartItem[]): boolean {
  if (a.length !== b.length) return false
  for (let i = 0; i < a.length; i += 1) {
    const x = a[i]!
    const y = b[i]!
    if (x.id !== y.id) return false
    if (x.product.id !== y.product.id) return false
    if (x.quantity !== y.quantity) return false
  }
  return true
}

interface CartStore extends Cart {
  addItem: (product: Product, quantity?: number) => void
  removeItem: (itemId: string) => void
  updateQuantity: (itemId: string, quantity: number) => void
  clearCart: () => void
  calculateTotals: () => void
  hydrate: (items: ReadonlyArray<CartItem>) => void
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      subtotal: 0,
      shipping: 0,
      tax: 0,
      total: 0,

      addItem: (product: Product, quantity = 1) => {
        const items = get().items
        const existingItem = items.find((item) => item.product.id === product.id)

        if (existingItem) {
          get().updateQuantity(existingItem.id, existingItem.quantity + quantity)
        } else {
          const newItem: CartItem = {
            id: `${product.id}-${Date.now()}`,
            product,
            quantity,
          }
          set({ items: [...items, newItem] })
          get().calculateTotals()
          ;(async () => {
            try {
              await cartApi.addItem({
                id: newItem.id,
                productId: product.id,
                name: product.name,
                price: Math.round(product.price * 100),
                quantity,
                imageUrl: product.images?.[0],
              })
              await queryClient.invalidateQueries({ queryKey: CART_QK })
            } catch (e) {
              console.warn("cartApi.addItem failed", e)
            }
          })()
        }
      },

      removeItem: (itemId: string) => {
        const items = get().items.filter((item) => item.id !== itemId)
        set({ items })
        get().calculateTotals()
        ;(async () => {
          try {
            await cartApi.removeItem({ id: itemId })
            await queryClient.invalidateQueries({ queryKey: CART_QK })
          } catch (e) {
            console.warn("cartApi.removeItem failed", e)
          }
        })()
      },

      updateQuantity: (itemId: string, quantity: number) => {
        if (quantity <= 0) {
          get().removeItem(itemId)
          return
        }

        const items = get().items.map((item) => (item.id === itemId ? { ...item, quantity } : item))
        set({ items })
        get().calculateTotals()
        ;(async () => {
          try {
            await cartApi.updateItem({ id: itemId, quantity })
            await queryClient.invalidateQueries({ queryKey: CART_QK })
          } catch (e) {
            console.warn("cartApi.updateItem failed", e)
          }
        })()
      },

      clearCart: () => {
        set({ items: [], subtotal: 0, shipping: 0, tax: 0, total: 0 })
      },

      calculateTotals: () => {
        const items = get().items
        const subtotal = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0)
        const shipping = subtotal > FREE_SHIPPING_THRESHOLD ? 0 : FLAT_SHIPPING_FEE
        const tax = subtotal * TAX_RATE
        const total = subtotal + shipping + tax

        set({ subtotal, shipping, tax, total })
      },

      hydrate: (items: ReadonlyArray<CartItem>) => {
        const prev = get().items
        // Avoid infinite update loops by skipping when cart content is unchanged.
        if (cartItemsEqual(prev, items)) return
        set({ items: [...items] })
        get().calculateTotals()
      },
    }),
    {
      name: "cart-storage",
    },
  ),
)
