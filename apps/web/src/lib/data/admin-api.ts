/**
 * Admin API client for dashboard data.
 * One export per file: `adminApi`.
 */

const API_BASE: string = "/api/v1"

async function asJson<T>(res: Response): Promise<T> {
  const ct: string | null = res.headers.get("content-type")
  const isJson: boolean = !!ct && ct.includes("application/json")
  const body: unknown = isJson ? await res.json() : undefined
  if (!res.ok) {
    const message: string =
      (body as { readonly error?: string })?.error ?? `Request failed (${res.status})`
    throw new Error(message)
  }
  return body as T
}

export type AdminStats = Readonly<{
  productsCount: number
  categoriesCount: number
  featuredProductsCount: number
  digitalProductsCount: number
  physicalProductsCount: number
  latestCreatedAt?: string
}>

export type RecentProduct = Readonly<{
  id: string
  name: string
  slug: string
  priceCents: number
  currency: "USD"
  imageUrl?: string
  createdAt: string
}>

export const adminApi = {
  stats: async (): Promise<AdminStats> => {
    const res: Response = await fetch(`${API_BASE}/admin/stats`, { credentials: "include" })
    return asJson<AdminStats>(res)
  },
  recentProducts: async (limit = 10): Promise<Readonly<{ items: readonly RecentProduct[] }>> => {
    const usp = new URLSearchParams()
    if (typeof limit === "number" && Number.isFinite(limit)) usp.set("limit", String(limit))
    const res: Response = await fetch(`${API_BASE}/admin/recent-products?${usp.toString()}`, {
      credentials: "include",
    })
    return asJson<Readonly<{ items: readonly RecentProduct[] }>>(res)
  },
  /** Orders: Admin shapes */
  listOrders: async (
    opts?: Readonly<{
      status?: "pending" | "paid" | "shipped" | "delivered" | "cancelled"
      limit?: number
    }>,
  ): Promise<Readonly<{ items: readonly AdminOrder[] }>> => {
    const usp = new URLSearchParams()
    if (opts?.status) usp.set("status", opts.status)
    if (typeof opts?.limit === "number" && Number.isFinite(opts.limit))
      usp.set("limit", String(opts.limit))
    const res: Response = await fetch(`${API_BASE}/admin/orders?${usp.toString()}`, {
      credentials: "include",
    })
    return asJson<Readonly<{ items: readonly AdminOrder[] }>>(res)
  },
  getOrder: async (id: string): Promise<AdminOrder> => {
    const res: Response = await fetch(`${API_BASE}/admin/orders/${encodeURIComponent(id)}`, {
      credentials: "include",
    })
    return asJson<AdminOrder>(res)
  },
  updateOrderStatus: async (id: string, status: AdminOrder["status"]): Promise<AdminOrder> => {
    const res: Response = await fetch(`${API_BASE}/admin/orders/${encodeURIComponent(id)}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ status }),
    })
    return asJson<AdminOrder>(res)
  },
  /**
   * Affiliate conversions: list and update status
   */
  listAffiliateConversions: async (
    opts?: Readonly<{ status?: "pending" | "approved" | "paid"; limit?: number }>,
  ): Promise<Readonly<{ items: readonly AdminAffiliateConversion[] }>> => {
    const usp = new URLSearchParams()
    if (opts?.status) usp.set("status", opts.status)
    if (typeof opts?.limit === "number" && Number.isFinite(opts.limit))
      usp.set("limit", String(opts.limit))
    const res: Response = await fetch(`${API_BASE}/admin/affiliate/conversions?${usp.toString()}`, {
      credentials: "include",
    })
    return asJson<Readonly<{ items: readonly AdminAffiliateConversion[] }>>(res)
  },
  updateAffiliateConversionStatus: async (
    id: string,
    status: AdminAffiliateConversion["status"],
  ): Promise<AdminAffiliateConversion> => {
    const res: Response = await fetch(
      `${API_BASE}/admin/affiliate/conversions/${encodeURIComponent(id)}/status`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status }),
      },
    )
    return asJson<AdminAffiliateConversion>(res)
  },
  /**
   * Reviews: Admin list and update status
   */
  listReviews: async (
    opts?: Readonly<{
      status?: "Pending" | "Published" | "Rejected"
      productId?: string
      userId?: string
      limit?: number
    }>,
  ): Promise<Readonly<{ items: readonly AdminReview[] }>> => {
    const usp = new URLSearchParams()
    if (opts?.status) usp.set("status", opts.status)
    if (opts?.productId) usp.set("productId", opts.productId)
    if (opts?.userId) usp.set("userId", opts.userId)
    if (typeof opts?.limit === "number" && Number.isFinite(opts.limit))
      usp.set("limit", String(opts.limit))
    const res: Response = await fetch(`${API_BASE}/admin/reviews?${usp.toString()}`, {
      credentials: "include",
    })
    return asJson<Readonly<{ items: readonly AdminReview[] }>>(res)
  },
  updateReviewStatus: async (id: string, status: AdminReview["status"]): Promise<AdminReview> => {
    const res: Response = await fetch(
      `${API_BASE}/admin/reviews/${encodeURIComponent(id)}/status`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status }),
      },
    )
    return asJson<AdminReview>(res)
  },
  /**
   * Customers: Admin list (aggregated from users and orders)
   */
  listCustomers: async (
    opts?: Readonly<{ query?: string; limit?: number; page?: number }>,
  ): Promise<Readonly<{ items: readonly AdminCustomer[] }>> => {
    const usp = new URLSearchParams()
    if (opts?.query && opts.query.trim().length > 0) usp.set("query", opts.query.trim())
    if (typeof opts?.limit === "number" && Number.isFinite(opts.limit))
      usp.set("limit", String(opts.limit))
    if (typeof opts?.page === "number" && Number.isFinite(opts.page))
      usp.set("page", String(opts.page))
    const res: Response = await fetch(`${API_BASE}/admin/customers?${usp.toString()}`, {
      credentials: "include",
    })
    return asJson<Readonly<{ items: readonly AdminCustomer[] }>>(res)
  },
} as const

export type AdminOrderItem = Readonly<{
  id: string
  orderId: string
  productId?: string
  name: string
  priceCents: number
  quantity: number
  imageUrl?: string
}>

export type AdminOrder = Readonly<{
  id: string
  userId: string | null
  guestId: string | null
  email: string | null
  subtotalCents: number
  shippingCents: number
  taxCents: number
  totalCents: number
  createdAt: string // ISO
  status: "pending" | "paid" | "shipped" | "delivered" | "cancelled"
  paymentProvider?: "stripe" | "paypal"
  paymentRef?: string
  items: readonly AdminOrderItem[]
}>

export type AdminAffiliateConversion = Readonly<{
  id: string
  clickId: string
  orderId: string
  userId: string | null
  code: string
  commissionCents: number
  status: "pending" | "approved" | "paid"
  createdAt: string // ISO
  paidAt: string | null // ISO | null
}>

export type AdminReview = Readonly<{
  id: string
  userId: string | null
  productId: string
  rating: number
  title: string | null
  content: string | null
  status: "Pending" | "Published" | "Rejected"
  createdAt: string // ISO
  updatedAt: string // ISO
}>

export type AdminCustomer = Readonly<{
  id: string
  name: string
  email: string
  imageUrl?: string
  createdAt: string // ISO
  ordersCount: number
  totalSpentCents: number
  status: "Active" | "Inactive" | "VIP"
}>
