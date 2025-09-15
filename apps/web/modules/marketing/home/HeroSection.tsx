"use client"

import dynamic from "next/dynamic"
import type { JSX } from "react"
import { useEffect, useState } from "react"
import { animationsDisabled } from "@/lib/safe-mode"
import { AppLink } from "../../shared/components/app-link"

const HeroCarouselDynamic = dynamic(() => import("./HeroCarousel").then((m) => m.HeroCarousel), {
  ssr: false,
})

// Allow hard-disabling the hero carousel in production to isolate hydration/render issues.
const disableHero: boolean =
  (process.env.NEXT_PUBLIC_DISABLE_HERO ?? "false").toLowerCase() === "true"

/**
 * HeroSection renders the full-width hero carousel for the home page.
 * Progressive enhancement: in dev or when animations are disabled, we
 * initially render a static variant and upgrade to the dynamic carousel
 * after first user interaction or an idle period to avoid jank.
 */
function useIdleOrFirstInteraction(timeoutMs: number = 1500): boolean {
  const [ready, setReady] = useState<boolean>(false)
  useEffect(() => {
    if (ready) return
    const onAny = (): void => setReady(true)
    const idler = (
      window as unknown as {
        requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number
      }
    ).requestIdleCallback
      ? (
          window as unknown as {
            requestIdleCallback: (cb: () => void, opts?: { timeout: number }) => number
          }
        ).requestIdleCallback(() => setReady(true), { timeout: timeoutMs })
      : window.setTimeout(() => setReady(true), timeoutMs)
    window.addEventListener("pointerdown", onAny, { once: true, passive: true })
    window.addEventListener("keydown", onAny, { once: true })
    return () => {
      window.removeEventListener("pointerdown", onAny)
      window.removeEventListener("keydown", onAny)
      const w = window as unknown as { cancelIdleCallback?: (id: number) => void }
      if (w.cancelIdleCallback) w.cancelIdleCallback(idler as unknown as number)
      else window.clearTimeout(idler as unknown as number)
    }
  }, [ready, timeoutMs])
  return ready
}

export function HeroSection(): JSX.Element {
  const ready: boolean = useIdleOrFirstInteraction(1500)
  if (disableHero) {
    return (
      <section className="relative w-full overflow-hidden bg-gradient-to-br from-primary/5 via-background to-secondary/5">
        <div className="container mx-auto px-4 py-16 lg:py-24">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            <div className="space-y-4 text-center lg:text-left">
              <span className="inline-flex items-center rounded border px-2 py-0.5 text-xs">
                Open Source
              </span>
              <h1 className="text-4xl lg:text-6xl font-bold tracking-tight">
                Next.js Ecommerce Starterkit
              </h1>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto lg:mx-0">
                A comprehensive, production‑ready foundation: Next.js 15, TypeScript, Tailwind CSS,
                shadcn/ui, Better Auth, Drizzle, and a modular monorepo. Built to learn from and
                launch with.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
                <AppLink
                  href="https://github.com/Dendro-X0/next-ecommerce-starterkit"
                  className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-white"
                >
                  Star on GitHub
                </AppLink>
                <AppLink
                  href="/shop"
                  className="inline-flex items-center justify-center rounded-md border px-4 py-2"
                >
                  Explore the demo
                </AppLink>
              </div>
            </div>
            <div className="hidden lg:block">
              <div className="aspect-[4/3] w-full rounded-xl border bg-muted" />
            </div>
          </div>
        </div>
      </section>
    )
  }
  if (animationsDisabled && !ready) {
    return (
      <section className="relative w-full overflow-hidden bg-gradient-to-br from-primary/5 via-background to-secondary/5">
        <div className="container mx-auto px-4 py-16 lg:py-24">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            <div className="space-y-4 text-center lg:text-left">
              <span className="inline-flex items-center rounded border px-2 py-0.5 text-xs">
                Open Source
              </span>
              <h1 className="text-4xl lg:text-6xl font-bold tracking-tight">
                Next.js Ecommerce Starterkit
              </h1>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto lg:mx-0">
                A comprehensive, production‑ready foundation: Next.js 15, TypeScript, Tailwind CSS,
                shadcn/ui, Better Auth, Drizzle, and a modular monorepo. Built to learn from and
                launch with.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
                <AppLink
                  href="https://github.com/Dendro-X0/next-ecommerce-starterkit"
                  className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-white"
                >
                  Star on GitHub
                </AppLink>
                <AppLink
                  href="/shop"
                  className="inline-flex items-center justify-center rounded-md border px-4 py-2"
                >
                  Explore the demo
                </AppLink>
              </div>
            </div>
            <div className="hidden lg:block">
              <div className="aspect-[4/3] w-full rounded-xl border bg-muted" />
            </div>
          </div>
        </div>
      </section>
    )
  }
  return <HeroCarouselDynamic />
}
