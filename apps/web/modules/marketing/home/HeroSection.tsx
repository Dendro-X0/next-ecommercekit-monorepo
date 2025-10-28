"use client"

import dynamic from "next/dynamic"
import type { JSX } from "react"
import { useEffect, useState } from "react"
import { animationsDisabled } from "@/lib/safe-mode"
import { AppLink } from "../../shared/components/app-link"
import { SafeImage } from "@/components/ui/safe-image"

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

  // Always SSR a static hero with the same fixed height as the carousel
  // to prevent a large CLS when the client-only carousel mounts.
  const StaticHero = (
    <section className="relative w-full h-[600px] lg:h-[700px] overflow-hidden bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      {/* Background image with high priority for LCP */}
      <div className="absolute inset-0">
        <AppLink href="/shop" className="sr-only">Explore the demo</AppLink>
        <div className="absolute inset-0">
          <div className="relative w-full h-full">
            <AppLink href="#" aria-hidden="true">
              {/* Use the first slide image as a static backdrop */}
              <div className="absolute inset-0">
                <div className="absolute inset-0">
                  <div className="relative w-full h-full">
                    <SafeImage
                      src="/shop1.png"
                      alt="Next.js Ecommerce Starterkit"
                      fill
                      sizes="100vw"
                      priority
                      fetchPriority="high"
                      className="object-cover opacity-20"
                    />
                  </div>
                </div>
              </div>
            </AppLink>
            <div className="absolute inset-0 bg-gradient-to-r from-background/90 via-background/70 to-background/90" />
          </div>
        </div>
      </div>
      <div className="relative z-10 container mx-auto px-4 h-full flex items-center">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center w-full">
          <div className="space-y-6 text-center lg:text-left">
            <div className="space-y-4">
              <span className="inline-flex items-center rounded border px-2 py-0.5 text-xs">Open Source</span>
              <div className="space-y-2">
                <h1 className="text-4xl lg:text-6xl font-bold tracking-tight">Next.js Ecommerce Starterkit</h1>
                <h2 className="text-xl lg:text-2xl text-primary font-semibold">Ship faster with best practices</h2>
              </div>
              <p className="text-lg text-muted-foreground max-w-2xl">A comprehensive, production‑ready foundation: Next.js 15, TypeScript, Tailwind CSS, shadcn/ui, Better Auth, Drizzle, and a modular monorepo. Built to learn from and launch with.</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <AppLink href="https://github.com/Dendro-X0/next-ecommerce-starterkit" className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-white">Star on GitHub</AppLink>
              <AppLink href="/shop" className="inline-flex items-center justify-center rounded-md border px-4 py-2">Explore the demo</AppLink>
            </div>
          </div>
          <div className="relative hidden lg:block">
            <div className="relative aspect-square lg:aspect-[4/3] overflow-hidden rounded-2xl bg-muted border" />
          </div>
        </div>
      </div>
    </section>
  )

  if (disableHero) return StaticHero
  if (!ready) return StaticHero
  if (animationsDisabled && !ready) return StaticHero
  return <HeroCarouselDynamic />
}
