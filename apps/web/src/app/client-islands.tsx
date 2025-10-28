"use client"

import dynamic from "next/dynamic"
import type { JSX } from "react"
import { useEffect, useState } from "react"

const AffiliateTracker = dynamic(
  async () => (await import("@/lib/affiliate/tracker")).AffiliateTracker,
  {
    ssr: false,
    loading: () => null,
  },
)
const CartHydrator = dynamic(async () => (await import("@/lib/cart/hydrator")).CartHydrator, {
  ssr: false,
  loading: () => null,
})
const Toaster = dynamic(async () => (await import("sonner")).Toaster, {
  ssr: false,
  loading: () => null,
})

type ClientIslandsProps = Readonly<{
  enableAffiliate: boolean
  enableCartHydrator: boolean
  enableToaster: boolean
}>

type WindowWithIdle = Window & {
  readonly requestIdleCallback?: (
    cb: IdleRequestCallback,
    opts?: { readonly timeout?: number },
  ) => number
  readonly cancelIdleCallback?: (id: number) => void
}

function useIdleOrFirstInteraction(timeoutMs: number = 3000): boolean {
  const [ready, setReady] = useState<boolean>(false)
  useEffect(() => {
    if (ready) return
    const onAny = (): void => setReady(true)
    const w = window as WindowWithIdle
    const idler: number = w.requestIdleCallback
      ? w.requestIdleCallback(() => setReady(true), { timeout: timeoutMs })
      : window.setTimeout(() => setReady(true), timeoutMs)
    window.addEventListener("pointerdown", onAny, { once: true, passive: true })
    window.addEventListener("keydown", onAny, { once: true })
    return () => {
      window.removeEventListener("pointerdown", onAny)
      window.removeEventListener("keydown", onAny)
      if (w.cancelIdleCallback) {
        try {
          w.cancelIdleCallback(idler)
        } catch {
          /* no-op */
        }
      } else {
        window.clearTimeout(idler)
      }
    }
  }, [ready, timeoutMs])
  return ready
}

export function ClientIslands({
  enableAffiliate,
  enableCartHydrator,
  enableToaster,
}: ClientIslandsProps): JSX.Element | null {
  const disableIslands: boolean =
    (process.env.NEXT_PUBLIC_DISABLE_ISLANDS ?? "false").toLowerCase() === "true"
  const ready: boolean = useIdleOrFirstInteraction(4000)
  const shouldRender: boolean = !disableIslands && ready
  return shouldRender ? (
    <>
      {enableCartHydrator ? <CartHydrator /> : null}
      {enableAffiliate ? <AffiliateTracker /> : null}
      {enableToaster ? <Toaster position="top-center" richColors /> : null}
    </>
  ) : null
}
