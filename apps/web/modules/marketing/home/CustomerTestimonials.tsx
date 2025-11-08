"use client"

import { Check, ChevronLeft, ChevronRight, Star } from "lucide-react"
import type { JSX } from "react"
import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { animationsDisabled } from "@/lib/safe-mode"

type Testimonial = {
  readonly id: number
  readonly name: string
  readonly rating: number
  readonly comment: string
  readonly verified: boolean
}

const testimonials: readonly Testimonial[] = [
  {
    id: 1,
    name: "Sarah M.",
    rating: 5,
    comment:
      "I'm blown away by the quality and style of the clothes I received from Shop.co. From casual wear to elegant dresses, every piece I've bought has exceeded my expectations.",
    verified: true,
  },
  {
    id: 2,
    name: "Alex K.",
    rating: 5,
    comment:
      "Finding clothes that align with my personal style used to be a challenge until I discovered Shop.co. The range of options they offer is truly remarkable, catering to a variety of tastes and occasions.",
    verified: true,
  },
  {
    id: 3,
    name: "James L.",
    rating: 5,
    comment:
      "As someone who's always on the lookout for unique fashion pieces, I'm thrilled to have stumbled upon Shop.co. The selection of clothes is not only diverse but also on-point with the latest trends.",
    verified: true,
  },
  {
    id: 4,
    name: "Mooen",
    rating: 5,
    comment:
      "The customer service is exceptional and the quality of products is outstanding. I've been shopping here for months and never been disappointed.",
    verified: true,
  },
]

const LG_BREAKPOINT = 1024 as const

const clamp = (value: number, min: number, max: number): number => {
  if (value < min) return min
  if (value > max) return max
  return value
}

/**
 * CustomerTestimonials renders a responsive carousel (1 slide on mobile, 3 on desktop)
 * with mouse/finger dragging and animated transitions using Framer Motion.
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

export function CustomerTestimonials(): JSX.Element {
  const ready: boolean = useIdleOrFirstInteraction(1500)
  const enabled: boolean = !animationsDisabled || ready
  // Hooks MUST be called unconditionally and in the same order each render
  const containerRef = useRef<HTMLDivElement | null>(null)
  const isDraggingRef = useRef<boolean>(false)
  const startXRef = useRef<number>(0)
  const startScrollLeftRef = useRef<number>(0)
  const draggedRef = useRef<boolean>(false)
  const headingId = useId()
  const [slidesPerView, setSlidesPerView] = useState<number>(1)
  const [currentPage, setCurrentPage] = useState<number>(0)

  const updateLayout = useCallback((): void => {
    const isDesktop = window.innerWidth >= LG_BREAKPOINT
    setSlidesPerView(isDesktop ? 3 : 1)
  }, [])

  useEffect(() => {
    if (!enabled) return
    updateLayout()
    window.addEventListener("resize", updateLayout)
    return () => window.removeEventListener("resize", updateLayout)
  }, [enabled, updateLayout])

  const next = useCallback((): void => {
    const el = containerRef.current
    if (!el) return
    const maxPage: number = Math.max(0, Math.ceil(testimonials.length / slidesPerView) - 1)
    const page: number = Math.min(currentPage + 1, maxPage)
    el.scrollTo({ left: page * el.clientWidth, behavior: "smooth" })
  }, [currentPage, slidesPerView])

  const prev = useCallback((): void => {
    const el = containerRef.current
    if (!el) return
    const page: number = Math.max(currentPage - 1, 0)
    el.scrollTo({ left: page * el.clientWidth, behavior: "smooth" })
  }, [currentPage])

  const goToPage = useCallback(
    (page: number): void => {
      const el = containerRef.current
      if (!el) return
      const maxPage: number = Math.max(0, Math.ceil(testimonials.length / slidesPerView) - 1)
      const p: number = clamp(page, 0, maxPage)
      el.scrollTo({ left: p * el.clientWidth, behavior: "smooth" })
    },
    [slidesPerView],
  )

  const pageCount = useMemo<number>(() => {
    return Math.max(1, Math.ceil(testimonials.length / slidesPerView))
  }, [slidesPerView])

  const handleScroll = useCallback(
    (e: React.UIEvent<HTMLDivElement>): void => {
      const el = e.currentTarget
      const page: number = Math.round(el.scrollLeft / el.clientWidth)
      const maxPage: number = Math.max(0, Math.ceil(testimonials.length / slidesPerView) - 1)
      setCurrentPage(clamp(page, 0, maxPage))
    },
    [slidesPerView],
  )

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>): void => {
    const el = containerRef.current
    if (!el) return
    isDraggingRef.current = true
    draggedRef.current = false
    startXRef.current = e.clientX
    startScrollLeftRef.current = el.scrollLeft
    try {
      el.setPointerCapture(e.pointerId)
    } catch {}
  }

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>): void => {
    if (!isDraggingRef.current) return
    const el = containerRef.current
    if (!el) return
    const dx = e.clientX - startXRef.current
    if (Math.abs(dx) > 3) draggedRef.current = true
    el.scrollLeft = startScrollLeftRef.current - dx
  }

  const endDrag = (e?: React.PointerEvent<HTMLDivElement>): void => {
    if (!isDraggingRef.current) return
    isDraggingRef.current = false
    try {
      if (e && e.pointerId != null) containerRef.current?.releasePointerCapture(e.pointerId)
    } catch {}
    setTimeout(() => {
      draggedRef.current = false
    }, 0)
  }

  // Derived arrays to avoid relying on map index as React keys
  const pages: readonly number[] = useMemo<number[]>(() => {
    return Array.from({ length: pageCount }, (_, i) => i)
  }, [pageCount])
  const stars: readonly number[] = useMemo<number[]>(() => {
    return [0, 1, 2, 3, 4]
  }, [])

  if (!enabled) {
    return (
      <section
        aria-live="polite"
        className="py-16 bg-white dark:bg-gray-900"
        aria-labelledby={headingId}
        style={{ contentVisibility: "auto", containIntrinsicSize: "1200px 700px" }}
      >
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-12">
            <h2 id={headingId} className="section-title text-black dark:text-white">
              OUR HAPPY CUSTOMERS
            </h2>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {testimonials.map((t) => (
              <Card
                key={t.id}
                className="border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 h-full"
              >
                <CardContent className="p-6">
                  <div className="flex items-center gap-1 mb-4" aria-hidden="true">
                    {stars.map((s) => (
                      <Star
                        key={`star-${t.id}-${s}`}
                        className={
                          s < t.rating
                            ? "h-5 w-5 fill-yellow-400 text-yellow-400"
                            : "h-5 w-5 text-gray-300 dark:text-gray-600"
                        }
                      />
                    ))}
                  </div>
                  <span className="sr-only">Rating: {t.rating} out of 5</span>
                  <div className="flex items-start gap-2 mb-4">
                    <h3 className="font-semibold text-black dark:text-white">{t.name}</h3>
                    {t.verified && (
                      <div className="flex items-center gap-1 bg-green-700 text-white dark:bg-green-200 dark:text-black px-2 py-1 rounded-full text-xs">
                        <Check className="h-3 w-3" aria-hidden />
                        <span>Verified</span>
                      </div>
                    )}
                  </div>
                  <p className="text-gray-600 dark:text-gray-300 leading-relaxed">"{t.comment}"</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
    )
  }

  return (
    <section
      aria-live="polite"
      className="py-16 bg-white dark:bg-gray-900"
      aria-labelledby={headingId}
      style={{ contentVisibility: "auto", containIntrinsicSize: "1200px 700px" }}
    >
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-12">
          <h2 id={headingId} className="section-title text-black dark:text-white">
            OUR HAPPY CUSTOMERS
          </h2>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={prev}
              aria-label="Previous testimonials"
              title="Previous testimonials"
              className="w-11 h-11 rounded-full border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-800 bg-transparent"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={next}
              aria-label="Next testimonials"
              title="Next testimonials"
              className="w-11 h-11 rounded-full border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-800 bg-transparent"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="relative">
          <div
            ref={containerRef}
            className="flex overflow-x-auto snap-x snap-mandatory scroll-smooth cursor-grab active:cursor-grabbing select-none no-scrollbar"
            onScroll={handleScroll}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={endDrag}
            onPointerLeave={endDrag}
            onClickCapture={(e) => {
              if (draggedRef.current) {
                e.preventDefault()
                e.stopPropagation()
              }
            }}
          >
            {testimonials.map((t) => (
              <div key={t.id} className="shrink-0 px-2 basis-full lg:basis-1/3 snap-start">
                <Card className="border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 h-full">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-1 mb-4" aria-hidden="true">
                      {stars.map((s) => (
                        <Star
                          key={`star-${t.id}-${s}`}
                          className={
                            s < t.rating
                              ? "h-5 w-5 fill-yellow-400 text-yellow-400"
                              : "h-5 w-5 text-gray-300 dark:text-gray-600"
                          }
                        />
                      ))}
                    </div>
                    <span className="sr-only">Rating: {t.rating} out of 5</span>
                    <div className="flex items-start gap-2 mb-4">
                      <h3 className="font-semibold text-black dark:text-white">{t.name}</h3>
                      {t.verified && (
                        <div className="flex items-center gap-1 bg-green-700 text-white dark:bg-green-200 dark:text-black px-2 py-1 rounded-full text-xs">
                          <Check className="h-3 w-3" aria-hidden />
                          <span>Verified</span>
                        </div>
                      )}
                    </div>
                    <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                      "{t.comment}"
                    </p>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
          <div
            aria-hidden
            className="pointer-events-none absolute inset-y-0 left-0 w-10 sm:w-16 bg-gradient-to-r from-white dark:from-gray-900 to-transparent"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute inset-y-0 right-0 w-10 sm:w-16 bg-gradient-to-l from-white dark:from-gray-900 to-transparent"
          />
        </div>

        <div className="flex justify-center gap-3 mt-8">
          {pages.map((page) => {
            const active = page === currentPage
            return (
              <button
                key={`page-${page}`}
                type="button"
                onClick={() => goToPage(page)}
                aria-label={`Go to page ${page + 1}`}
                aria-current={active ? "page" : undefined}
                title={`Go to page ${page + 1}`}
                className="w-6 h-6 flex items-center justify-center rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black dark:focus-visible:ring-white ring-offset-2 ring-offset-background"
              >
                <span
                  className={
                    active
                      ? "w-3 h-3 rounded-full bg-black dark:bg-white"
                      : "w-2.5 h-2.5 rounded-full bg-gray-500 dark:bg-gray-400"
                  }
                />
              </button>
            )
          })}
        </div>
      </div>
    </section>
  )
}
