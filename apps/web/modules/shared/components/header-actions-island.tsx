"use client"

import dynamic from "next/dynamic"
import type { JSX } from "react"
import { useEffect, useState } from "react"

const WishlistBadge = dynamic(
  async () => (await import("./islands/wishlist-badge")).WishlistBadge,
  {
    ssr: false,
    loading: () => null,
  },
)
const CartDrawer = dynamic(async () => (await import("@/components/cart/cart-drawer")).CartDrawer, {
  ssr: false,
  loading: () => null,
})
const AuthMenu = dynamic(async () => (await import("./islands/auth-menu")).AuthMenu, {
  ssr: false,
  loading: () => null,
})

function useEnableOnFirstInteraction(): boolean {
  const [enabled, setEnabled] = useState<boolean>(false)
  useEffect(() => {
    if (enabled) return
    const onAny = (): void => setEnabled(true)
    const idler = (window as any).requestIdleCallback
      ? (window as any).requestIdleCallback(() => setEnabled(true), { timeout: 7000 })
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
      if ((window as any).cancelIdleCallback) {
        try {
          ;(window as any).cancelIdleCallback(idler)
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

export function HeaderActionsIsland(): JSX.Element {
  const enabled: boolean = useEnableOnFirstInteraction()
  const disableWishlist: boolean =
    (process.env.NEXT_PUBLIC_DISABLE_WISHLIST_ISLAND ?? "false").toLowerCase() === "true"
  const disableCart: boolean =
    (process.env.NEXT_PUBLIC_DISABLE_CART_ISLAND ?? "false").toLowerCase() === "true"
  const disableAuth: boolean =
    (process.env.NEXT_PUBLIC_DISABLE_AUTH_ISLAND ?? "false").toLowerCase() === "true"

  if (!enabled) {
    return <div className="hidden sm:flex items-center gap-2" />
  }

  return (
    <div className="hidden sm:flex items-center gap-2">
      {!disableWishlist && <WishlistBadge />}
      {!disableCart && <CartDrawer />}
      {!disableAuth && <AuthMenu />}
    </div>
  )
}
