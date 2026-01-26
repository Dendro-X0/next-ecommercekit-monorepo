import { X } from "lucide-react"
import type { JSX } from "react"
import { ThemeToggle } from "@/components/theme/theme-toggle"
import { AppLink } from "./app-link"
import { ShopLogo } from "./shop-logo"
import { HeaderActionsIsland } from "./header-actions-island"
import { HeaderMobileMenu } from "./header-mobile-menu"
import { HeaderNavIsland } from "./header-nav-island"
import { HeaderSearch } from "./header-search"
import { LocaleSwitcher } from "./locale-switcher"
import { headers } from "next/headers"
import { getLocaleFromHeaders } from "modules/shared/lib/i18n/config"
import { translate } from "modules/shared/lib/i18n"

type NavItem = {
  readonly titleKey: string
  readonly href: string
  readonly hasDropdown?: boolean
}

const navigationItems: ReadonlyArray<NavItem> = [
  { titleKey: "nav.shop", href: "/shop" },
  // Categories dropdown removed for performance; now a simple link to /categories
  { titleKey: "nav.categories", href: "/categories" },
  { titleKey: "nav.contact", href: "/contact" },
  { titleKey: "nav.dashboard", href: "/dashboard" },
]

export async function Header(): Promise<JSX.Element> {
  const disableHeaderInteractions: boolean =
    (process.env.NEXT_PUBLIC_DISABLE_HEADER_INTERACTIONS ?? "false").toLowerCase() === "true"
  // Hide announcement bar by default to reduce CLS; opt-in via env
  const disableAnnouncementBar: boolean =
    (process.env.NEXT_PUBLIC_DISABLE_ANNOUNCEMENT_BAR ?? "true").toLowerCase() === "true"
  const disableHeaderSearch: boolean =
    (process.env.NEXT_PUBLIC_DISABLE_HEADER_SEARCH ?? "false").toLowerCase() === "true"
  const h = await headers()
  const locale = getLocaleFromHeaders(h)
  if (disableHeaderInteractions) {
    // Minimal, static header with no data fetching or interactivity
    return (
      <header className="sticky top-0 z-40 w-full border-b bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between gap-3 lg:grid lg:grid-cols-12 lg:gap-4">
          {/* Left: logo + simple nav */}
          <div className="flex items-center gap-3 min-w-0 lg:col-span-4">
            <AppLink href="/" className="flex items-center gap-2" aria-label="ModularShop home">
              <ShopLogo />
              <span className="text-2xl font-black text-black dark:text-white">SHOP</span>
            </AppLink>
            <nav className="hidden md:flex items-center space-x-1">
              <AppLink
                href="/shop"
                className="px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-black dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-800 rounded-md transition-all duration-200"
              >
                {translate(locale, "nav.shop")}
              </AppLink>
              <AppLink
                href="/categories"
                className="px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-black dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-800 rounded-md transition-all duration-200"
              >
                {translate(locale, "nav.categories")}
              </AppLink>
            </nav>
          </div>
          {/* Center: search */}
          {!disableHeaderSearch && (
            <div className="hidden lg:flex lg:col-span-4 justify-center">
              <div className="w-full max-w-md">
                <HeaderSearch />
              </div>
            </div>
          )}
          {/* Right: theme toggle + hamburger (mobile on far right) */}
          <div className="relative z-20 pointer-events-auto flex items-center justify-end gap-2 sm:gap-3 lg:col-span-4">
            <LocaleSwitcher />
            <ThemeToggle />
            {/* Static header: omit interactive mobile menu to isolate hydration */}
          </div>
        </div>
      </header>
    )
  }
  // Server component shell: no client hooks/effects here.

  return (
    <>
      {/* Announcement Bar (optional) */}
      {!disableAnnouncementBar && (
        <div className="bg-black text-white text-center py-2 text-sm relative">
          <span className="px-2">Demo notice: payments are disabled in this deployment.</span>
          <AppLink
            href="/auth/signup"
            className="inline-flex items-center px-1.5 py-1 underline hover:no-underline text-white"
          >
            Create an account
          </AppLink>
          <span className="px-2">to explore the full UI. See</span>
          <AppLink
            href="https://github.com/Dendro-X0/next-ecommerce-starterkit#readme"
            className="inline-flex items-center px-1.5 py-1 underline hover:no-underline text-white"
          >
            README
          </AppLink>
          <span className="px-2">for setup details.</span>
          <button
            type="button"
            className="absolute right-2 top-1.5 flex h-10 w-10 items-center justify-center rounded-full hover:opacity-70 transition-opacity"
            aria-label="Dismiss banner"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      <header className="sticky top-0 z-40 w-full border-b border-border/40 bg-background/60 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60 transition-all duration-300">
        <div className="container mx-auto px-4 h-16 sm:h-20 flex items-center justify-between gap-4 lg:grid lg:grid-cols-12 lg:gap-8">
          {/* Left: logo + nav island */}
          <div className="flex items-center gap-6 min-w-0 lg:col-span-4 h-full">
            <AppLink
              href="/"
              className="flex items-center gap-2.5 group transition-transform hover:scale-[1.02] active:scale-[0.98]"
              aria-label="ModularShop home"
            >
              <div className="p-2 rounded-xl bg-primary/5 group-hover:bg-primary/10 transition-colors">
                <ShopLogo />
              </div>
              <span className="text-xl sm:text-2xl font-black tracking-tighter text-foreground">SHOP</span>
            </AppLink>
            <div className="hidden lg:block h-6 w-[1px] bg-border/40" />
            <HeaderNavIsland navigationItems={navigationItems} locale={locale} />
          </div>
          {/* Center: search */}
          {!disableHeaderSearch && (
            <div className="hidden lg:flex lg:col-span-4 justify-center items-center h-full">
              <div className="w-full max-w-md scale-95 focus-within:scale-100 transition-transform duration-300">
                <HeaderSearch />
              </div>
            </div>
          )}
          {/* Right: actions + theme toggle + mobile hamburger (far right) */}
          <div className="relative z-20 flex items-center justify-end gap-1.5 sm:gap-4 lg:col-span-4 h-full">
            <div className="hidden sm:flex items-center gap-2">
              <HeaderActionsIsland />
              <div className="h-6 w-[1px] bg-border/40 mx-1" />
            </div>
            <div className="flex items-center gap-1 sm:gap-2">
              <div className="hidden md:block">
                <LocaleSwitcher />
              </div>
              <ThemeToggle />
            </div>
            <HeaderMobileMenu navigationItems={navigationItems} locale={locale} />
          </div>
        </div>
      </header>
    </>
  )
}
