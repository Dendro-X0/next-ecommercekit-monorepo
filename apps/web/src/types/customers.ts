export interface Customer {
  id: string
  name: string
  email: string
  phone?: string
  avatar?: string
  status: "Active" | "Inactive" | "Suspended"
  totalOrders: number
  totalSpent: number
  averageOrderValue: number
  lastOrderDate: string
  joinDate: string
  location: string
  customerGroup: string
  tags: string[]
  notes?: string
}

export interface CustomerGroup {
  id: string
  name: string
  description: string
  customerCount: number
  criteria: {
    type: "spending" | "orders" | "location" | "custom"
    value: string | number
    operator: "greater_than" | "less_than" | "equals" | "contains"
  }[]
  benefits: string[]
  createdAt: string
  isActive: boolean
}

export interface Review {
  id: string
  customerId: string
  customerName: string
  customerAvatar?: string
  productId: string
  productName: string
  rating: number
  title: string
  comment: string
  status: "Published" | "Pending" | "Rejected"
  isVerified: boolean
  helpfulCount: number
  createdAt: string
  updatedAt: string
  response?: {
    message: string
    respondedBy: string
    respondedAt: string
  }
}

export interface CustomerStats {
  totalCustomers: number
  activeCustomers: number
  newCustomersThisMonth: number
  customerGrowthRate: number
  averageCustomerValue: number
  topSpendingCustomers: Customer[]
}
