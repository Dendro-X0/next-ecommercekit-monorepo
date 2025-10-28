export interface DashboardStats {
  totalRevenue: number
  revenueChange: number
  totalOrders: number
  ordersChange: number
  totalCustomers: number
  customersChange: number
  totalProducts: number
  productsChange: number
}

export interface ChartDataPoint {
  name: string
  value: number
  date?: string
}

export interface RevenueData extends ChartDataPoint {
  revenue: number
  orders: number
}

export interface CustomerData extends ChartDataPoint {
  customers: number
  newCustomers: number
}

export interface ProductPerformance {
  id: string
  name: string
  category: string
  sales: number
  revenue: number
  growth: number
}

export interface OrderTrend {
  period: string
  orders: number
  revenue: number
  avgOrderValue: number
}

export interface ReportData {
  id: string
  title: string
  description: string
  type: "revenue" | "orders" | "customers" | "products"
  dateRange: string
  status: "completed" | "processing" | "scheduled"
  createdAt: string
  downloadUrl?: string
}

export interface AnalyticsMetrics {
  conversionRate: number
  avgOrderValue: number
  customerLifetimeValue: number
  returnCustomerRate: number
  cartAbandonmentRate: number
}
