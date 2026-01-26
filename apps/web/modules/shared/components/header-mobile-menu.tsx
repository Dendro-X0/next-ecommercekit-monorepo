"use client"

import { Heart, LayoutGrid, LogIn, LogOut, Menu, ShoppingCart, UserPlus } from "lucide-react"
import { translate } from "modules/shared/lib/i18n"
import { getLocaleFromPath, type Locale } from "modules/shared/lib/i18n/config"
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
  locale: localeProp,
}: {
  readonly navigationItems: readonly HeaderMobileNavItem[]
  readonly locale?: Locale
}): JSX.Element {
  const pathname: string = usePathname() ?? "/"
  const locale = localeProp ?? getLocaleFromPath(pathname)
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
        <SheetContent side="left" className="w-[85vw] sm:w-[380px] border-r border-border/40 bg-background/95 backdrop-blur-xl p-0 flex flex-col">
          <div className="p-6 border-b border-border/40">
            <SheetHeader className="flex flex-row items-center justify-between space-y-0 text-left">
              <SheetTitle className="text-xl font-black uppercase tracking-tighter text-left">Menu</SheetTitle>
            </SheetHeader>
          </div>

          <div className="flex-1 overflow-y-auto pt-4 px-4 no-scrollbar">
            <div className="space-y-4">
              <div className="space-y-1">
                <p className="px-4 text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/60 mb-2">Navigation</p>
                {navigationItems.map((item) => (
                  <AppLink
                    key={item.titleKey}
                    href={item.href}
                    className="flex items-center gap-3 px-4 py-3 text-base font-bold text-foreground hover:bg-primary/5 rounded-xl transition-all duration-300 group"
                  >
                    <span className="group-hover:translate-x-1 transition-transform">{translate(locale, item.titleKey)}</span>
                  </AppLink>
                ))}
              </div>

              <div className="pt-4 space-y-1">
                <p className="px-4 text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/60 mb-2">My Account</p>
                <AppLink
                  href="/dashboard/user/wishlist"
                  className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-primary/5 transition-all group"
                  aria-label="Wishlist"
                >
                  <Heart className="h-5 w-5 text-muted-foreground group-hover:text-red-500 group-hover:fill-red-500/10 transition-colors" />
                  <span className="font-bold">Wishlist</span>
                </AppLink>
                <AppLink
                  href="/cart"
                  className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-primary/5 transition-all group"
                  aria-label="Cart"
                >
                  <div className="relative">
                    <ShoppingCart className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                    {cartCount > 0 && (
                      <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-primary-foreground border-2 border-background">
                        {cartCount}
                      </span>
                    )}
                  </div>
                  <span className="font-bold">Shopping Cart</span>
                </AppLink>
              </div>
            </div>
          </div>

          <div className="p-6 bg-muted/30 border-t border-border/40 mt-auto">
            {!user ? (
              <div className="grid grid-cols-2 gap-3">
                <Button asChild variant="outline" className="h-12 rounded-xl font-bold border-border/50 hover:bg-background transition-all" size="lg">
                  <AppLink href="/auth/login" aria-label="Login">
                    <LogIn className="h-4 w-4 mr-2" /> Login
                  </AppLink>
                </Button>
                <Button asChild className="h-12 rounded-xl font-bold shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all" size="lg">
                  <AppLink href="/auth/signup" aria-label="Register">
                    <UserPlus className="h-4 w-4 mr-2" /> Register
                  </AppLink>
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  {isAdmin && (
                    <Button asChild variant="secondary" className="h-12 rounded-xl font-bold border-border/50" size="lg">
                      <AppLink href="/dashboard/admin" aria-label="Admin">
                        <LayoutGrid className="h-4 w-4 mr-2" /> Admin
                      </AppLink>
                    </Button>
                  )}
                  <Button asChild variant="secondary" className="h-12 rounded-xl font-bold border-border/50" size="lg">
                    <AppLink href="/dashboard/user" aria-label="Dashboard">
                      <LayoutGrid className="h-4 w-4 mr-2" /> User
                    </AppLink>
                  </Button>
                </div>
                <Button
                  size="lg"
                  variant="ghost"
                  className="w-full h-12 rounded-xl font-bold text-muted-foreground hover:text-red-500 hover:bg-red-500/5 transition-all"
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
