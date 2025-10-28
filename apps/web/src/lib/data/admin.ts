import {
  BarChart3,
  Bell,
  CreditCard,
  Database,
  MessageSquare,
  Palette,
  Settings2,
  Shield,
  ShoppingCart,
  SquareTerminal,
  Store,
  TrendingUp,
  Truck,
  Users,
} from "lucide-react"

import { links } from "@/lib/links"

// Admin user data
export const adminUser = {
  name: "Admin User",
  email: "admin@modularshop.com",
  avatar:
    "https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&dpr=2",
}

// Team/Organization data
export const teams = [
  {
    name: "ModularShop",
    logo: Store,
    plan: "Enterprise",
  },
  {
    name: "Analytics Hub",
    logo: BarChart3,
    plan: "Pro",
  },
  {
    name: "Customer Support",
    logo: MessageSquare,
    plan: "Free",
  },
]

// Main navigation structure
export const navMain = [
  {
    title: "Dashboard",
    url: links.getDashboardAdminDashboardOverviewRoute(),
    icon: SquareTerminal,
    isActive: true,
    items: [
      {
        title: "Overview",
        url: links.getDashboardAdminDashboardOverviewRoute(),
      },
      {
        title: "Analytics",
        url: links.getDashboardAdminDashboardAnalyticsRoute(),
      },
      {
        title: "Reports",
        url: links.getDashboardAdminDashboardReportsRoute(),
      },
    ],
  },
  {
    title: "E-commerce",
    url: links.getDashboardAdminEcommerceProductsRoute(),
    icon: ShoppingCart,
    items: [
      {
        title: "Products",
        url: links.getDashboardAdminEcommerceProductsRoute(),
      },
      {
        title: "Orders",
        url: links.getDashboardAdminEcommerceOrdersRoute(),
      },
      {
        title: "Inventory",
        url: links.getDashboardAdminEcommerceInventoryRoute(),
      },
    ],
  },
  {
    title: "Customers",
    url: links.getDashboardAdminCustomersRoute(),
    icon: Users,
    items: [
      {
        title: "All Customers",
        url: links.getDashboardAdminCustomersRoute(),
      },
      {
        title: "Customer Groups",
        url: links.getDashboardAdminCustomersGroupsRoute(),
        disabled: true,
      },
      {
        title: "Reviews",
        url: links.getDashboardAdminCustomersReviewsRoute(),
        disabled: false,
      },
    ],
  },
  {
    title: "Marketing",
    url: links.getDashboardAdminMarketingRoute(),
    icon: TrendingUp,
    items: [
      {
        title: "Affiliate",
        url: links.getDashboardAdminMarketingAffiliateRoute(),
      },
      {
        title: "Ads",
        url: links.getDashboardAdminMarketingAdsRoute(),
      },
      {
        title: "Campaigns",
        url: links.getDashboardAdminMarketingCampaignsRoute(),
        disabled: true,
      },
      {
        title: "Discounts",
        url: links.getDashboardAdminMarketingDiscountsRoute(),
        disabled: true,
      },
      {
        title: "Coupons",
        url: links.getDashboardAdminMarketingCouponsRoute(),
        disabled: true,
      },
      {
        title: "Email Marketing",
        url: links.getDashboardAdminMarketingEmailRoute(),
        disabled: false,
      },
    ],
  },
  {
    title: "Finance",
    url: links.getDashboardAdminFinanceRoute(),
    icon: CreditCard,
    items: [
      {
        title: "Transactions",
        url: links.getDashboardAdminFinanceTransactionsRoute(),
        disabled: true,
      },
      {
        title: "Refunds",
        url: links.getDashboardAdminFinanceRefundsRoute(),
        disabled: false,
      },
      {
        title: "Tax Settings",
        url: links.getDashboardAdminFinanceTaxRoute(),
        disabled: true,
      },
      {
        title: "Payment Methods",
        url: links.getDashboardAdminFinancePaymentsRoute(),
        disabled: true,
      },
    ],
  },
]

// Settings and tools navigation
export const navProjects = [
  {
    name: "Store Settings",
    url: links.getDashboardAdminSettingsStoreRoute(),
    icon: Settings2,
    disabled: true,
  },
  {
    name: "Shipping",
    url: links.getDashboardAdminSettingsShippingRoute(),
    icon: Truck,
    disabled: true,
  },
  {
    name: "Notifications",
    url: links.getDashboardAdminSettingsNotificationsRoute(),
    icon: Bell,
    disabled: true,
  },
  {
    name: "Security",
    url: links.getDashboardAdminSettingsSecurityRoute(),
    icon: Shield,
    disabled: true,
  },
  {
    name: "Appearance",
    url: links.getDashboardAdminSettingsAppearanceRoute(),
    icon: Palette,
    disabled: true,
  },
  {
    name: "Database",
    url: links.getDashboardAdminSettingsDatabaseRoute(),
    icon: Database,
    disabled: true,
  },
]

// Dashboard statistics
export const dashboardStats = [
  {
    title: "Total Revenue",
    value: "$45,231.89",
    change: "+20.1%",
    trend: "up" as const,
    description: "from last month",
  },
  {
    title: "Orders",
    value: "2,350",
    change: "+180.1%",
    trend: "up" as const,
    description: "from last month",
  },
  {
    title: "Customers",
    value: "12,234",
    change: "+19%",
    trend: "up" as const,
    description: "from last month",
  },
  {
    title: "Products",
    value: "573",
    change: "+201",
    trend: "up" as const,
    description: "total active products",
  },
]

// Recent orders data
export const recentOrders = [
  {
    id: "#3210",
    customer: "Olivia Martin",
    email: "olivia.martin@email.com",
    status: "Fulfilled" as const,
    amount: "$1,999.00",
  },
  {
    id: "#3209",
    customer: "Jackson Lee",
    email: "jackson.lee@email.com",
    status: "Fulfilled" as const,
    amount: "$39.00",
  },
  {
    id: "#3208",
    customer: "Isabella Nguyen",
    email: "isabella.nguyen@email.com",
    status: "Unfulfilled" as const,
    amount: "$299.00",
  },
  {
    id: "#3207",
    customer: "William Kim",
    email: "will@email.com",
    status: "Fulfilled" as const,
    amount: "$99.00",
  },
  {
    id: "#3206",
    customer: "Sofia Davis",
    email: "sofia.davis@email.com",
    status: "Fulfilled" as const,
    amount: "$39.00",
  },
]

// Products data
export const products = [
  {
    id: "PROD-001",
    name: "Wireless Bluetooth Headphones",
    category: "Electronics",
    price: "$199.99",
    stock: 45,
    status: "Active" as const,
    image:
      "https://images.pexels.com/photos/3394650/pexels-photo-3394650.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&dpr=2",
  },
  {
    id: "PROD-002",
    name: "Premium Coffee Beans",
    category: "Food & Beverage",
    price: "$24.99",
    stock: 120,
    status: "Active" as const,
    image:
      "https://images.pexels.com/photos/894695/pexels-photo-894695.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&dpr=2",
  },
  {
    id: "PROD-003",
    name: "Organic Cotton T-Shirt",
    category: "Clothing",
    price: "$29.99",
    stock: 0,
    status: "Out of Stock" as const,
    image:
      "https://images.pexels.com/photos/996329/pexels-photo-996329.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&dpr=2",
  },
  {
    id: "PROD-004",
    name: "Smart Fitness Watch",
    category: "Electronics",
    price: "$299.99",
    stock: 23,
    status: "Active" as const,
    image:
      "https://images.pexels.com/photos/437037/pexels-photo-437037.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&dpr=2",
  },
  {
    id: "PROD-005",
    name: "Handcrafted Leather Wallet",
    category: "Accessories",
    price: "$79.99",
    stock: 67,
    status: "Active" as const,
    image:
      "https://images.pexels.com/photos/1152077/pexels-photo-1152077.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&dpr=2",
  },
]

// Orders data
export const orders = [
  {
    id: "#3210",
    customer: "Olivia Martin",
    email: "olivia.martin@email.com",
    status: "Fulfilled" as const,
    paymentStatus: "Paid" as const,
    total: "$1,999.00",
    date: "2024-01-15",
    items: 3,
  },
  {
    id: "#3209",
    customer: "Jackson Lee",
    email: "jackson.lee@email.com",
    status: "Fulfilled" as const,
    paymentStatus: "Paid" as const,
    total: "$39.00",
    date: "2024-01-14",
    items: 1,
  },
  {
    id: "#3208",
    customer: "Isabella Nguyen",
    email: "isabella.nguyen@email.com",
    status: "Unfulfilled" as const,
    paymentStatus: "Pending" as const,
    total: "$299.00",
    date: "2024-01-14",
    items: 2,
  },
  {
    id: "#3207",
    customer: "William Kim",
    email: "will@email.com",
    status: "Fulfilled" as const,
    paymentStatus: "Paid" as const,
    total: "$99.00",
    date: "2024-01-13",
    items: 1,
  },
  {
    id: "#3206",
    customer: "Sofia Davis",
    email: "sofia.davis@email.com",
    status: "Cancelled" as const,
    paymentStatus: "Refunded" as const,
    total: "$39.00",
    date: "2024-01-12",
    items: 1,
  },
]

// Customers data
export const customers = [
  {
    id: "CUST-001",
    name: "Olivia Martin",
    email: "olivia.martin@email.com",
    avatar:
      "https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&dpr=2",
    orders: 12,
    totalSpent: "$2,847.00",
    status: "Active" as const,
    joinDate: "2023-06-15",
  },
  {
    id: "CUST-002",
    name: "Jackson Lee",
    email: "jackson.lee@email.com",
    avatar:
      "https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&dpr=2",
    orders: 8,
    totalSpent: "$1,234.00",
    status: "Active" as const,
    joinDate: "2023-08-22",
  },
  {
    id: "CUST-003",
    name: "Isabella Nguyen",
    email: "isabella.nguyen@email.com",
    avatar:
      "https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&dpr=2",
    orders: 3,
    totalSpent: "$567.00",
    status: "Active" as const,
    joinDate: "2023-11-10",
  },
  {
    id: "CUST-004",
    name: "William Kim",
    email: "will@email.com",
    avatar:
      "https://images.pexels.com/photos/1681010/pexels-photo-1681010.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&dpr=2",
    orders: 15,
    totalSpent: "$3,456.00",
    status: "VIP" as const,
    joinDate: "2023-03-05",
  },
  {
    id: "CUST-005",
    name: "Sofia Davis",
    email: "sofia.davis@email.com",
    avatar:
      "https://images.pexels.com/photos/1130626/pexels-photo-1130626.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&dpr=2",
    orders: 1,
    totalSpent: "$89.00",
    status: "Inactive" as const,
    joinDate: "2024-01-08",
  },
]
