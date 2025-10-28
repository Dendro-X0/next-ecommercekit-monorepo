export const mainNavigation = [
  {
    name: "Categories",
    href: "/categories",
    hasDropdown: true,
    items: [
      {
        name: "Electronics",
        href: "/categories/electronics",
        description: "Latest gadgets and tech",
        image: "/placeholder.svg?height=48&width=48",
      },
      {
        name: "Clothing",
        href: "/categories/clothing",
        description: "Fashion for everyone",
        image: "/placeholder.svg?height=48&width=48",
      },
      {
        name: "Home & Garden",
        href: "/categories/home-garden",
        description: "Everything for your home",
        image: "/placeholder.svg?height=48&width=48",
      },
      {
        name: "Sports",
        href: "/categories/sports",
        description: "Fitness and outdoor gear",
        image: "/placeholder.svg?height=48&width=48",
      },
      {
        name: "Books",
        href: "/categories/books",
        description: "Digital and physical books",
        image: "/placeholder.svg?height=48&width=48",
      },
      {
        name: "Beauty",
        href: "/categories/beauty",
        description: "Skincare and cosmetics",
        image: "/placeholder.svg?height=48&width=48",
      },
    ],
  },
  {
    name: "New Arrivals",
    href: "/new-arrivals",
    hasDropdown: true,
    items: [
      { name: "This Week", href: "/new-arrivals/week", description: "Latest products this week" },
      { name: "This Month", href: "/new-arrivals/month", description: "New products this month" },
      { name: "Trending", href: "/new-arrivals/trending", description: "What's popular now" },
      { name: "Pre-orders", href: "/new-arrivals/pre-orders", description: "Coming soon items" },
    ],
  },
  {
    name: "Deals",
    href: "/deals",
    hasDropdown: true,
    items: [
      { name: "Daily Deals", href: "/deals/daily", description: "Limited time offers" },
      { name: "Clearance", href: "/deals/clearance", description: "Up to 70% off" },
      { name: "Bundle Offers", href: "/deals/bundles", description: "Save more with bundles" },
      { name: "Flash Sales", href: "/deals/flash", description: "Quick deals, limited stock" },
    ],
  },
  {
    name: "Brands",
    href: "/brands",
    hasDropdown: true,
    items: [
      { name: "Featured Brands", href: "/brands/featured", description: "Top brand partners" },
      { name: "Premium", href: "/brands/premium", description: "Luxury and high-end" },
      { name: "Eco-Friendly", href: "/brands/eco", description: "Sustainable choices" },
      { name: "Local", href: "/brands/local", description: "Support local businesses" },
    ],
  },
  {
    name: "Services",
    href: "/services",
    hasDropdown: true,
    items: [
      { name: "Installation", href: "/services/installation", description: "Professional setup" },
      { name: "Warranty", href: "/services/warranty", description: "Extended protection" },
      { name: "Support", href: "/services/support", description: "24/7 customer help" },
      { name: "Returns", href: "/services/returns", description: "Easy return policy" },
    ],
  },
  {
    name: "Dashboard",
    href: "/dashboard/user",
    hasDropdown: true,
    items: [
      { name: "Overview", href: "/dashboard/user", description: "Your orders and activity" },
      {
        name: "Settings",
        href: "/dashboard/user/settings/profile",
        description: "Profile and security",
      },
    ],
  },
]

export const quickFilters = [
  { name: "All Items", value: "all" },
  { name: "Best Sellers", value: "bestsellers" },
  { name: "On Sale", value: "sale" },
  { name: "Free Shipping", value: "freeshipping" },
  { name: "New", value: "new" },
  { name: "Premium", value: "premium" },
]
