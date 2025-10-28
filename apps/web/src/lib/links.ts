/**
 * Route builders and link helpers for the dashboard and shop.
 * One export per file: `links`.
 */
interface LinksApi {
  readonly isExternal: (url: string) => boolean
  readonly getShopHomeRoute: () => string
  readonly getDashboardUserHomeRoute: () => string
  readonly getDashboardUserOrdersRoute: () => string
  /** Dashboard → User → Wishlist */
  readonly getDashboardUserWishlistRoute: () => string
  /** Dashboard → User → Loyalty */
  readonly getDashboardUserLoyaltyRoute: () => string
  /** Dashboard → User → Reviews */
  readonly getDashboardUserReviewsRoute: () => string
  /** Dashboard → User → Affiliate */
  readonly getDashboardUserAffiliateRoute: () => string
  /** Dashboard → User → Settings root */
  readonly getDashboardUserSettingsRoute: () => string
  /** Dashboard → User → Settings → Profile */
  readonly getDashboardUserSettingsProfileRoute: () => string
  /** Dashboard → User → Settings → Addresses */
  readonly getDashboardUserSettingsAddressesRoute: () => string
  /** Dashboard → User → Settings → Security */
  readonly getDashboardUserSettingsSecurityRoute: () => string
  /** Dashboard → User → Settings → Notifications */
  readonly getDashboardUserSettingsNotificationsRoute: () => string
  /** Dashboard → Admin → Dashboard → Overview */
  readonly getDashboardAdminDashboardOverviewRoute: () => string
  /** Dashboard → Admin → Dashboard → Analytics */
  readonly getDashboardAdminDashboardAnalyticsRoute: () => string
  /** Dashboard → Admin → Dashboard → Reports */
  readonly getDashboardAdminDashboardReportsRoute: () => string
  /** Dashboard → Admin → E-commerce → Products */
  readonly getDashboardAdminEcommerceProductsRoute: () => string
  /** Dashboard → Admin → E-commerce → Products → Create */
  readonly getDashboardAdminEcommerceProductCreateRoute: () => string
  /** Dashboard → Admin → E-commerce → Products → Edit (by ID) */
  readonly getDashboardAdminEcommerceProductEditRoute: (productId: string) => string
  /** Dashboard → Admin → E-commerce → Orders */
  readonly getDashboardAdminEcommerceOrdersRoute: () => string
  /** Dashboard → Admin → E-commerce → Orders → Detail (by ID) */
  readonly getDashboardAdminEcommerceOrderDetailRoute: (orderId: string) => string
  /** Dashboard → Admin → E-commerce → Inventory */
  readonly getDashboardAdminEcommerceInventoryRoute: () => string
  /** Dashboard → Admin → Customers (root) */
  readonly getDashboardAdminCustomersRoute: () => string
  /** Dashboard → Admin → Customers → Groups */
  readonly getDashboardAdminCustomersGroupsRoute: () => string
  /** Dashboard → Admin → Customers → Reviews */
  readonly getDashboardAdminCustomersReviewsRoute: () => string
  /** Dashboard → Admin → Marketing (root) */
  readonly getDashboardAdminMarketingRoute: () => string
  /** Dashboard → Admin → Marketing → Campaigns */
  readonly getDashboardAdminMarketingCampaignsRoute: () => string
  /** Dashboard → Admin → Marketing → Discounts */
  readonly getDashboardAdminMarketingDiscountsRoute: () => string
  /** Dashboard → Admin → Marketing → Coupons */
  readonly getDashboardAdminMarketingCouponsRoute: () => string
  /** Dashboard → Admin → Marketing → Email */
  readonly getDashboardAdminMarketingEmailRoute: () => string
  /** Dashboard → Admin → Marketing → Affiliate */
  readonly getDashboardAdminMarketingAffiliateRoute: () => string
  /** Dashboard → Admin → Marketing → Ads */
  readonly getDashboardAdminMarketingAdsRoute: () => string
  /** Dashboard → Admin → Finance (root) */
  readonly getDashboardAdminFinanceRoute: () => string
  /** Dashboard → Admin → Finance → Transactions */
  readonly getDashboardAdminFinanceTransactionsRoute: () => string
  /** Dashboard → Admin → Finance → Refunds */
  readonly getDashboardAdminFinanceRefundsRoute: () => string
  /** Dashboard → Admin → Finance → Tax */
  readonly getDashboardAdminFinanceTaxRoute: () => string
  /** Dashboard → Admin → Finance → Payment Methods */
  readonly getDashboardAdminFinancePaymentsRoute: () => string
  /** Dashboard → Admin → Settings → Store */
  readonly getDashboardAdminSettingsStoreRoute: () => string
  /** Dashboard → Admin → Settings → Shipping */
  readonly getDashboardAdminSettingsShippingRoute: () => string
  /** Dashboard → Admin → Settings → Notifications */
  readonly getDashboardAdminSettingsNotificationsRoute: () => string
  /** Dashboard → Admin → Settings → Security */
  readonly getDashboardAdminSettingsSecurityRoute: () => string
  /** Dashboard → Admin → Settings → Appearance */
  readonly getDashboardAdminSettingsAppearanceRoute: () => string
  /** Dashboard → Admin → Settings → Database */
  readonly getDashboardAdminSettingsDatabaseRoute: () => string
}

function isExternal(url: string): boolean {
  try {
    const u: URL = new URL(url, "http://local")
    return ["http:", "https:"].includes(u.protocol) && !u.hostname.endsWith("local")
  } catch {
    return false
  }
}

function getShopHomeRoute(): string {
  return "/shop"
}

function getDashboardUserHomeRoute(): string {
  return "/dashboard/user"
}

function getDashboardUserOrdersRoute(): string {
  return "/dashboard/user/orders"
}

/** Dashboard → User → Wishlist */
function getDashboardUserWishlistRoute(): string {
  return "/dashboard/user/wishlist"
}

/** Dashboard → User → Loyalty (placeholder maps to Settings for now) */
function getDashboardUserLoyaltyRoute(): string {
  return "/dashboard/user/settings"
}

/** Dashboard → User → Reviews */
function getDashboardUserReviewsRoute(): string {
  return "/dashboard/user/reviews"
}

/** Dashboard → User → Affiliate */
function getDashboardUserAffiliateRoute(): string {
  return "/dashboard/user/affiliate"
}

/** Dashboard → User → Settings */
function getDashboardUserSettingsRoute(): string {
  return "/dashboard/user/settings"
}

/** Dashboard → User → Settings → Profile */
function getDashboardUserSettingsProfileRoute(): string {
  return "/dashboard/user/settings/profile"
}

/** Dashboard → User → Settings → Addresses */
function getDashboardUserSettingsAddressesRoute(): string {
  return "/dashboard/user/settings/addresses"
}

/** Dashboard → User → Settings → Security */
function getDashboardUserSettingsSecurityRoute(): string {
  return "/dashboard/user/settings/security"
}

/** Dashboard → User → Settings → Notifications */
function getDashboardUserSettingsNotificationsRoute(): string {
  return "/dashboard/user/settings/notifications"
}

/** Admin routes */
function getDashboardAdminDashboardOverviewRoute(): string {
  return "/dashboard/admin/dashboard/overview"
}

function getDashboardAdminDashboardAnalyticsRoute(): string {
  return "/dashboard/admin/dashboard/analytics"
}

function getDashboardAdminDashboardReportsRoute(): string {
  return "/dashboard/admin/dashboard/reports"
}

function getDashboardAdminEcommerceProductsRoute(): string {
  return "/dashboard/admin/ecommerce/products"
}

function getDashboardAdminEcommerceProductCreateRoute(): string {
  return "/dashboard/admin/ecommerce/products/create"
}

function getDashboardAdminEcommerceProductEditRoute(productId: string): string {
  return `/dashboard/admin/ecommerce/products/${productId}/edit`
}

function getDashboardAdminEcommerceOrdersRoute(): string {
  return "/dashboard/admin/ecommerce/orders"
}

function getDashboardAdminEcommerceOrderDetailRoute(orderId: string): string {
  const safeId: string = encodeURIComponent(orderId)
  return `/dashboard/admin/ecommerce/orders/${safeId}`
}

function getDashboardAdminEcommerceInventoryRoute(): string {
  return "/dashboard/admin/ecommerce/inventory"
}

function getDashboardAdminCustomersRoute(): string {
  return "/dashboard/admin/customers"
}

function getDashboardAdminCustomersGroupsRoute(): string {
  return "/dashboard/admin/customers/groups"
}

function getDashboardAdminCustomersReviewsRoute(): string {
  return "/dashboard/admin/customers/reviews"
}

function getDashboardAdminMarketingRoute(): string {
  return "/dashboard/admin/marketing"
}

function getDashboardAdminMarketingCampaignsRoute(): string {
  return "/dashboard/admin/marketing/campaigns"
}

function getDashboardAdminMarketingDiscountsRoute(): string {
  return "/dashboard/admin/marketing/discounts"
}

function getDashboardAdminMarketingCouponsRoute(): string {
  return "/dashboard/admin/marketing/coupons"
}

function getDashboardAdminMarketingEmailRoute(): string {
  return "/dashboard/admin/marketing/email"
}

function getDashboardAdminMarketingAffiliateRoute(): string {
  return "/dashboard/admin/marketing/affiliate"
}

function getDashboardAdminMarketingAdsRoute(): string {
  return "/dashboard/admin/marketing/ads"
}

function getDashboardAdminFinanceRoute(): string {
  return "/dashboard/admin/finance"
}

function getDashboardAdminFinanceTransactionsRoute(): string {
  return "/dashboard/admin/finance/transactions"
}

function getDashboardAdminFinanceRefundsRoute(): string {
  return "/dashboard/admin/finance/refunds"
}

function getDashboardAdminFinanceTaxRoute(): string {
  return "/dashboard/admin/finance/tax"
}

function getDashboardAdminFinancePaymentsRoute(): string {
  return "/dashboard/admin/finance/payments"
}

function getDashboardAdminSettingsStoreRoute(): string {
  return "/dashboard/admin/settings/store"
}

function getDashboardAdminSettingsShippingRoute(): string {
  return "/dashboard/admin/settings/shipping"
}

function getDashboardAdminSettingsNotificationsRoute(): string {
  return "/dashboard/admin/settings/notifications"
}

function getDashboardAdminSettingsSecurityRoute(): string {
  return "/dashboard/admin/settings/security"
}

function getDashboardAdminSettingsAppearanceRoute(): string {
  return "/dashboard/admin/settings/appearance"
}

function getDashboardAdminSettingsDatabaseRoute(): string {
  return "/dashboard/admin/settings/database"
}

/**
 * Links API (single export).
 */
export const links: LinksApi = {
  isExternal,
  getShopHomeRoute,
  getDashboardUserHomeRoute,
  getDashboardUserOrdersRoute,
  getDashboardUserWishlistRoute,
  getDashboardUserLoyaltyRoute,
  getDashboardUserReviewsRoute,
  getDashboardUserAffiliateRoute,
  getDashboardUserSettingsRoute,
  getDashboardUserSettingsProfileRoute,
  getDashboardUserSettingsAddressesRoute,
  getDashboardUserSettingsSecurityRoute,
  getDashboardUserSettingsNotificationsRoute,
  getDashboardAdminDashboardOverviewRoute,
  getDashboardAdminDashboardAnalyticsRoute,
  getDashboardAdminDashboardReportsRoute,
  getDashboardAdminEcommerceProductsRoute,
  getDashboardAdminEcommerceProductCreateRoute,
  getDashboardAdminEcommerceProductEditRoute,
  getDashboardAdminEcommerceOrdersRoute,
  getDashboardAdminEcommerceOrderDetailRoute,
  getDashboardAdminEcommerceInventoryRoute,
  getDashboardAdminCustomersRoute,
  getDashboardAdminCustomersGroupsRoute,
  getDashboardAdminCustomersReviewsRoute,
  getDashboardAdminMarketingRoute,
  getDashboardAdminMarketingCampaignsRoute,
  getDashboardAdminMarketingDiscountsRoute,
  getDashboardAdminMarketingCouponsRoute,
  getDashboardAdminMarketingEmailRoute,
  getDashboardAdminMarketingAffiliateRoute,
  getDashboardAdminMarketingAdsRoute,
  getDashboardAdminFinanceRoute,
  getDashboardAdminFinanceTransactionsRoute,
  getDashboardAdminFinanceRefundsRoute,
  getDashboardAdminFinanceTaxRoute,
  getDashboardAdminFinancePaymentsRoute,
  getDashboardAdminSettingsStoreRoute,
  getDashboardAdminSettingsShippingRoute,
  getDashboardAdminSettingsNotificationsRoute,
  getDashboardAdminSettingsSecurityRoute,
  getDashboardAdminSettingsAppearanceRoute,
  getDashboardAdminSettingsDatabaseRoute,
}
