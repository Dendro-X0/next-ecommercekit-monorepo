"use client"

import { translate } from "modules/shared/lib/i18n"
import type { Locale } from "modules/shared/lib/i18n/config"
import dynamic from "next/dynamic"
import { usePathname } from "next/navigation"
import type { JSX } from "react"
import { useEffect, useState } from "react"
import { AppLink } from "./app-link"

export type HeaderNavItem = Readonly<{
  titleKey: string
  href: string
  hasDropdown?: boolean
}>

const NavigationDropdown = dynamic(
  async () => (await import("./navigation-dropdown")).NavigationDropdown,
  {
    ssr: false,
    loading: () => null,
  },
)

function useEnableOnFirstInteraction(): boolean {
  const [enabled, setEnabled] = useState<boolean>(false)
  useEffect(() => {
    if (enabled) return
    const onAny = (): void => setEnabled(true)
    type ExtendedWindow = Window & {
      readonly requestIdleCallback?: (cb: () => void, opts?: { readonly timeout: number }) => number
      readonly cancelIdleCallback?: (id: number) => void
    }
    const w = window as ExtendedWindow
    const idler = w.requestIdleCallback
      ? w.requestIdleCallback(() => setEnabled(true), { timeout: 7000 })
      : window.setTimeout(() => setEnabled(true), 7000)
    window.addEventListener("pointerdown", onAny, { once: true, passive: true })
    window.addEventListener("keydown", onAny, { once: true })
    window.addEventListener("touchstart", onAny, { once: true, passive: true })
    window.addEventListener("focusin", onAny, { once: true })
    return () => {
      window.removeEventListener("pointerdown", onAny)
      window.removeEventListener("keydown", onAny)
      window.removeEventListener("touchstart", onAny)
      window.removeEventListener("focusin", onAny)
      if (w.cancelIdleCallback) {
        try {
          w.cancelIdleCallback(idler as number)
        } catch {
          /* no-op */
        }
      } else {
        window.clearTimeout(idler as number)
      }
    }
  }, [enabled])
  return enabled
}

export function HeaderNavIsland({
  navigationItems,
  locale,
}: {
  readonly navigationItems: readonly HeaderNavItem[]
  readonly locale: Locale
}): JSX.Element {
  const pathname: string = usePathname() ?? "/"
  const enabled: boolean = useEnableOnFirstInteraction()
  const disableDropdown: boolean =
    (process.env.NEXT_PUBLIC_DISABLE_NAV_DROPDOWN ?? "false").toLowerCase() === "true"

  return (
    <nav className="hidden md:flex items-center space-x-1 h-full" aria-label="Primary navigation">
      {navigationItems.map((item) => {
        const active = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href))
        return (
          <div key={item.titleKey} className="h-full flex items-center">
            {item.hasDropdown && enabled && !disableDropdown ? (
              <NavigationDropdown title={translate(locale, item.titleKey)} href={item.href} />
            ) : (
              <AppLink
                href={item.href}
                className={`px-4 h-full flex items-center text-[13px] font-bold tracking-tight transition-all duration-300 relative group ${active ? "text-foreground" : "text-muted-foreground hover:text-foreground"}`}
                aria-current={active ? "page" : undefined}
              >
                <span className="relative py-1">
                  {translate(locale, item.titleKey)}
                  <span className={`absolute -bottom-1 left-0 right-0 h-[2.5px] bg-primary rounded-full transition-all duration-500 shadow-[0_0_12px_var(--primary)] origin-center ${active ? "opacity-100 scale-x-100" : "opacity-0 scale-x-0 group-hover:opacity-100 group-hover:scale-x-100"}`} />
                </span>
              </AppLink>
            )}
          </div>
        )
      })}
    </nav>
  )
}
