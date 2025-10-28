import type { Product } from "./index"

export interface CartItem {
  id: string
  product: Product
  quantity: number
  selectedVariant?: string
}

export interface Cart {
  items: CartItem[]
  subtotal: number
  shipping: number
  tax: number
  total: number
}

export interface ShippingAddress {
  firstName: string
  lastName: string
  email: string
  phone: string
  address: string
  city: string
  state: string
  zipCode: string
  country: string
}

export interface PaymentMethod {
  id: string
  type: "card" | "stripe" | "paypal"
  name: string
  last4?: string
  expiryMonth?: number
  expiryYear?: number
}

export interface Order {
  id: string
  orderNumber: string
  status: "pending" | "processing" | "shipped" | "delivered" | "cancelled"
  items: CartItem[]
  shippingAddress: ShippingAddress
  paymentMethod: PaymentMethod
  subtotal: number
  shipping: number
  tax: number
  total: number
  createdAt: string
  estimatedDelivery?: string
}
