import type { User, UserOrder, UserStats, Wishlist } from "@/types/user"

export const userData: User = {
  id: "u-1",
  firstName: "John",
  lastName: "Doe",
  name: "John Doe",
  email: "john.doe@example.com",
  phone: "+1 (555) 123-4567",
  avatar: "/placeholder.svg?height=100&width=100",
  createdAt: "2024-01-15",
  joinDate: "2024-01-15",
  membershipTier: "Gold",
  totalSpent: 3287.45,
  totalOrders: 14,
  loyaltyPoints: 1240,
  addresses: [
    {
      id: "addr-1",
      type: "shipping",
      name: "John Doe",
      street: "123 Main St",
      city: "New York",
      state: "NY",
      zipCode: "10001",
      country: "United States",
      isDefault: true,
    },
    {
      id: "addr-2",
      type: "billing",
      name: "John Doe",
      street: "123 Main St",
      city: "New York",
      state: "NY",
      zipCode: "10001",
      country: "United States",
      isDefault: true,
    },
  ],
  paymentMethods: [
    {
      id: "pm-1",
      type: "card",
      brand: "Visa",
      last4: "4242",
      expiryMonth: 12,
      expiryYear: 2026,
      isDefault: true,
    },
  ],
  preferences: {
    newsletter: true,
    notifications: true,
    smsUpdates: false,
    theme: "system",
  },
}

export const userStats: UserStats = {
  totalOrders: 14,
  totalSpent: 3287.45,
  loyaltyPoints: 1240,
  savedAmount: 210.5,
  averageOrderValue: 234.82,
  favoriteCategory: "Electronics",
}

export const userOrders: UserOrder[] = [
  {
    id: "ord-1",
    orderNumber: "ORD-2024-001",
    date: "2024-06-21",
    status: "Delivered",
    total: 199.99,
    trackingNumber: "1Z9999999999999999",
    items: [
      {
        id: "oi-1",
        name: "Wireless Bluetooth Headphones",
        image: "/placeholder.svg?height=80&width=80",
        quantity: 1,
        price: 199.99,
        sku: "WH-001-GR",
      },
    ],
  },
  {
    id: "ord-2",
    orderNumber: "ORD-2024-002",
    date: "2024-07-08",
    status: "Shipped",
    total: 89.98,
    trackingNumber: "1Z1111111111111111",
    items: [
      {
        id: "oi-2",
        name: "Organic Cotton T-Shirt",
        image: "/placeholder.svg?height=80&width=80",
        quantity: 2,
        price: 44.99,
        sku: "TS-ORG-002-BK",
      },
    ],
  },
  {
    id: "ord-3",
    orderNumber: "ORD-2024-003",
    date: "2024-08-01",
    status: "Processing",
    total: 129.99,
    items: [
      {
        id: "oi-3",
        name: "Smart Home Security Camera",
        image: "/placeholder.svg?height=80&width=80",
        quantity: 1,
        price: 129.99,
        sku: "SHC-003-WH",
      },
    ],
  },
]

export const userWishlists: Wishlist[] = [
  {
    id: "wl-1",
    name: "My Favorites",
    isPublic: false,
    createdAt: "2024-05-10",
    items: [
      {
        id: "wli-1",
        productId: "p-1",
        name: "Wireless Bluetooth Headphones",
        price: 199.99,
        image: "/placeholder.svg?height=120&width=120",
        inStock: true,
        addedAt: "2024-05-11",
      },
      {
        id: "wli-2",
        productId: "p-2",
        name: "Smart Fitness Watch",
        price: 299.99,
        image: "/placeholder.svg?height=120&width=120",
        inStock: true,
        addedAt: "2024-06-03",
      },
      {
        id: "wli-3",
        productId: "p-3",
        name: "Ceramic Plant Pot Set",
        price: 34.99,
        image: "/placeholder.svg?height=120&width=120",
        inStock: false,
        addedAt: "2024-07-15",
      },
    ],
  },
]

export const spendingData: Array<{ name: string; amount: number }> = [
  { name: "Jan", amount: 120 },
  { name: "Feb", amount: 180 },
  { name: "Mar", amount: 220 },
  { name: "Apr", amount: 160 },
  { name: "May", amount: 240 },
  { name: "Jun", amount: 200 },
  { name: "Jul", amount: 260 },
  { name: "Aug", amount: 210 },
  { name: "Sep", amount: 230 },
  { name: "Oct", amount: 250 },
  { name: "Nov", amount: 300 },
  { name: "Dec", amount: 280 },
]

export const categorySpending: Array<{ name: string; amount: number; percentage: number }> = [
  { name: "Electronics", amount: 980, percentage: 42 },
  { name: "Clothing", amount: 540, percentage: 23 },
  { name: "Home & Garden", amount: 380, percentage: 16 },
  { name: "Sports", amount: 320, percentage: 14 },
  { name: "Other", amount: 120, percentage: 5 },
]
