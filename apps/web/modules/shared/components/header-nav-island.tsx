"use client"

import { translate } from "modules/shared/lib/i18n"
import { getLocaleFromPath } from "modules/shared/lib/i18n/config"
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
}: {
  readonly navigationItems: readonly HeaderNavItem[]
}): JSX.Element {
  const pathname: string = usePathname() ?? "/"
  const locale = getLocaleFromPath(pathname)
  const enabled: boolean = useEnableOnFirstInteraction()
  const disableDropdown: boolean =
    (process.env.NEXT_PUBLIC_DISABLE_NAV_DROPDOWN ?? "false").toLowerCase() === "true"

  return (
    <nav className="hidden md:flex items-center space-x-1" aria-label="Primary navigation">
      {navigationItems.map((item) => (
        <div key={item.titleKey}>
          {item.hasDropdown && enabled && !disableDropdown ? (
            <NavigationDropdown title={translate(locale, item.titleKey)} href={item.href} />
          ) : (
            <AppLink
              href={item.href}
              className="flex items-center gap-1 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-black dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-800 rounded-md transition-all duration-200"
              aria-current={
                pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href))
                  ? "page"
                  : undefined
              }
            >
              {translate(locale, item.titleKey)}
            </AppLink>
          )}
        </div>
      ))}
    </nav>
  )
}
