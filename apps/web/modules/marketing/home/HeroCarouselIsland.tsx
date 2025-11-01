"use client"

import dynamic from "next/dynamic"
import * as React from "react"

const HeroCarousel = dynamic(() => import("./HeroCarousel").then((m) => m.HeroCarousel), {
  ssr: false,
})

type WindowWithIdle = Window & {
  readonly requestIdleCallback?: (
    cb: IdleRequestCallback,
    opts?: { readonly timeout?: number },
  ) => number
  readonly cancelIdleCallback?: (id: number) => void
}

function useIdleOrFirstInteraction(timeoutMs: number = 1500): boolean {
  const [ready, setReady] = React.useState<boolean>(false)
  React.useEffect(() => {
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

export function HeroCarouselIsland(): React.ReactElement | null {
  const ready = useIdleOrFirstInteraction(1500)
  if (!ready) return null
  return <HeroCarousel />
}
