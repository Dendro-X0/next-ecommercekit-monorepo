/**
 * Order domain types used on the frontend.
 */

import type { CartItem, PaymentMethod, ShippingAddress } from "@/types/cart"

export type OrderStatus = "pending" | "paid" | "shipped" | "delivered" | "cancelled"
export type PaymentProvider = "stripe" | "paypal"

export interface OrderItem {
  readonly id: string
  readonly productId: string
  readonly name: string
  readonly price: number // dollars
  readonly quantity: number
  readonly imageUrl?: string
}

export interface Order {
  readonly id: string
  readonly createdAt: string
  readonly email?: string
  readonly status: OrderStatus
  readonly paymentProvider?: PaymentProvider
  readonly paymentRef?: string
  readonly items: readonly OrderItem[]
  readonly subtotal: number // dollars
  readonly shipping: number // dollars
  readonly tax: number // dollars
  readonly total: number // dollars
  readonly shippingAddress?: ShippingAddress
  readonly paymentMethod?: PaymentMethod
}

export interface CreateOrderInput {
  readonly email?: string
  readonly items: readonly OrderItem[]
  readonly subtotal: number
  readonly shipping: number
  readonly tax: number
  readonly total: number
  readonly paymentProvider?: PaymentProvider
  readonly paymentRef?: string
  readonly shippingAddress?: ShippingAddress
  readonly paymentMethod?: PaymentMethod
  readonly status?: OrderStatus
}

export function toOrderItemsFromCart(items: readonly CartItem[]): readonly OrderItem[] {
  return items.map((it) => ({
    id: it.id,
    productId: it.product.id,
    name: it.product.name,
    price: it.product.price,
    quantity: it.quantity,
    imageUrl: it.product.images?.[0],
  }))
}
