export interface User {
  id: string
  firstName: string
  lastName: string
  email: string
  phone?: string
  avatar?: string
  createdAt: string
  name: string
  joinDate: string
  membershipTier: "Bronze" | "Silver" | "Gold" | "Platinum"
  totalSpent: number
  totalOrders: number
  loyaltyPoints: number
  addresses: Address[]
  paymentMethods: PaymentMethod[]
  preferences: {
    newsletter: boolean
    notifications: boolean
    smsUpdates: boolean
    theme: "light" | "dark" | "system"
  }
}

export interface AdminStats {
  totalProducts: number
  totalOrders: number
  totalCustomers: number
  totalRevenue: number
  pendingOrders: number
  lowStockProducts: number
}

export interface Address {
  id: string
  type: "shipping" | "billing"
  name: string
  street: string
  city: string
  state: string
  zipCode: string
  country: string
  isDefault: boolean
}

export interface PaymentMethod {
  id: string
  type: "card" | "paypal" | "bank"
  last4?: string
  brand?: string
  expiryMonth?: number
  expiryYear?: number
  isDefault: boolean
}

export interface UserOrder {
  id: string
  orderNumber: string
  date: string
  status: "Processing" | "Shipped" | "Delivered" | "Cancelled"
  total: number
  items: OrderItem[]
  trackingNumber?: string
  estimatedDelivery?: string
}

export interface OrderItem {
  id: string
  name: string
  image: string
  quantity: number
  price: number
  sku: string
}

export interface UserStats {
  totalOrders: number
  totalSpent: number
  loyaltyPoints: number
  savedAmount: number
  averageOrderValue: number
  favoriteCategory: string
}

export interface Wishlist {
  id: string
  name: string
  items: WishlistItem[]
  isPublic: boolean
  createdAt: string
}

export interface WishlistItem {
  id: string
  productId: string
  name: string
  price: number
  image: string
  inStock: boolean
  addedAt: string
}
