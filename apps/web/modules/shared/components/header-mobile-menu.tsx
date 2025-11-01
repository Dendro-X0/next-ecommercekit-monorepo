"use client"

import { Heart, LayoutGrid, LogIn, LogOut, Menu, ShoppingCart, UserPlus } from "lucide-react"
import { translate } from "modules/shared/lib/i18n"
import { getLocaleFromPath } from "modules/shared/lib/i18n/config"
import { usePathname } from "next/navigation"
import type { JSX } from "react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { useSession } from "@/hooks/use-session"
import { isAdminEmail } from "@/lib/admin-allowlist"
import { authClient } from "@/lib/auth-client"
import { hasRole, type Role } from "@/lib/roles"
import { useCartStore } from "@/lib/stores/cart"
import { AppLink } from "./app-link"

export type HeaderMobileNavItem = Readonly<{
  titleKey: string
  href: string
}>

/**
 * Mobile hamburger menu. Visible only on small screens.
 * Renders a left-side Sheet with the provided navigation items.
 */
/**
 * Mobile hamburger menu. Includes primary navigation and key actions.
 */
export function HeaderMobileMenu({
  navigationItems,
}: {
  readonly navigationItems: readonly HeaderMobileNavItem[]
}): JSX.Element {
  const pathname: string = usePathname() ?? "/"
  const locale = getLocaleFromPath(pathname)
  const session = useSession()
  const user = session?.user ?? null
  const cartCount: number = useCartStore((s) => s.items.reduce((sum, it) => sum + it.quantity, 0))
  const roles: readonly Role[] | undefined =
    user && Array.isArray((user as Record<string, unknown>).roles)
      ? ((user as { readonly roles?: readonly Role[] }).roles as readonly Role[] | undefined)
      : undefined
  const isAdmin: boolean =
    (user as { readonly isAdmin?: boolean } | null)?.isAdmin === true ||
    hasRole(roles, ["admin"]) ||
    isAdminEmail(user?.email ?? null)
  return (
    <div className="md:hidden">
      <Sheet>
        <SheetTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            type="button"
            className="relative z-10 text-gray-700 dark:text-gray-300 hover:text-black dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800"
            aria-label="Open navigation menu"
          >
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-[85vw] sm:w-80">
          <SheetHeader className="flex items-center justify-between">
            <SheetTitle>Menu</SheetTitle>
          </SheetHeader>
          <nav className="mt-4 space-y-1">
            {navigationItems.map((item) => (
              <AppLink
                key={item.titleKey}
                href={item.href}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-black dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-800 rounded-md transition-all duration-200"
              >
                {translate(locale, item.titleKey)}
              </AppLink>
            ))}
          </nav>
          {/* Quick actions */}
          <div className="mt-6 border-t pt-4 space-y-2">
            <AppLink
              href="/dashboard/user/wishlist"
              className="flex items-center gap-2 px-4 py-2 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              aria-label="Wishlist"
            >
              <Heart className="h-4 w-4" />
              <span>Wishlist</span>
            </AppLink>
            <AppLink
              href="/cart"
              className="flex items-center gap-2 px-4 py-2 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              aria-label="Cart"
            >
              <ShoppingCart className="h-4 w-4" />
              <span>Cart</span>
              {cartCount > 0 && (
                <span
                  aria-hidden="true"
                  className="ml-2 inline-flex items-center justify-center min-w-5 h-5 px-1 rounded-full bg-black text-white dark:bg-white dark:text-black text-[10px] leading-5"
                >
                  {cartCount}
                </span>
              )}
            </AppLink>
            {!user ? (
              <div className="flex items-center gap-2 px-4 pt-2">
                <Button asChild variant="ghost" className="flex-1" size="sm">
                  <AppLink href="/auth/login" aria-label="Login">
                    <LogIn className="h-4 w-4 mr-2" /> Login
                  </AppLink>
                </Button>
                <Button asChild className="flex-1" size="sm">
                  <AppLink href="/auth/signup" aria-label="Register">
                    <UserPlus className="h-4 w-4 mr-2" /> Register
                  </AppLink>
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2 px-4 pt-2">
                {isAdmin && (
                  <Button asChild variant="secondary" className="flex-1" size="sm">
                    <AppLink href="/dashboard/admin" aria-label="Admin">
                      <LayoutGrid className="h-4 w-4 mr-2" /> Admin
                    </AppLink>
                  </Button>
                )}
                <Button asChild variant="secondary" className="flex-1" size="sm">
                  <AppLink href="/dashboard/user" aria-label="Dashboard">
                    <LayoutGrid className="h-4 w-4 mr-2" /> Dashboard
                  </AppLink>
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1"
                  onClick={async (): Promise<void> => {
                    await authClient.signOut()
                    window.location.assign("/")
                  }}
                >
                  <LogOut className="h-4 w-4 mr-2" /> Logout
                </Button>
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}
