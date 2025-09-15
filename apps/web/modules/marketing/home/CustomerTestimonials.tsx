"use client"

import { Check, ChevronLeft, ChevronRight, Star } from "lucide-react"
import { animate, motion, useMotionValue } from "motion/react"
import type { JSX } from "react"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
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
const DRAG_THRESHOLD_PX = 80 as const

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
  const [slidesPerView, setSlidesPerView] = useState<number>(1)
  const [containerWidth, setContainerWidth] = useState<number>(0)
  const [index, setIndex] = useState<number>(0)
  const x = useMotionValue(0)

  const maxIndex = useMemo<number>(() => {
    const total = testimonials.length
    const max = total - slidesPerView
    return max > 0 ? max : 0
  }, [slidesPerView])

  const slideWidth = useMemo<number>(() => {
    if (slidesPerView <= 0) return 0
    return containerWidth / slidesPerView
  }, [containerWidth, slidesPerView])

  const updateLayout = useCallback((): void => {
    const width = containerRef.current?.clientWidth ?? 0
    setContainerWidth(width)
    const isDesktop = window.innerWidth >= LG_BREAKPOINT
    setSlidesPerView(isDesktop ? 3 : 1)
  }, [])

  useEffect(() => {
    if (!enabled) return
    updateLayout()
    window.addEventListener("resize", updateLayout)
    return () => window.removeEventListener("resize", updateLayout)
  }, [enabled, updateLayout])

  // Keep index in range when slidesPerView changes responsively
  useEffect(() => {
    setIndex((prev) => clamp(prev, 0, maxIndex))
  }, [maxIndex])

  useEffect(() => {
    if (!enabled) return
    const target = -index * slideWidth
    animate(x, target, { type: "spring", bounce: 0, duration: 0.45 })
  }, [enabled, index, slideWidth, x])

  const next = useCallback((): void => {
    setIndex((prev) => clamp(prev + 1, 0, maxIndex))
  }, [maxIndex])

  const prev = useCallback((): void => {
    setIndex((prev) => clamp(prev - 1, 0, maxIndex))
  }, [maxIndex])

  const goToPage = useCallback(
    (page: number): void => {
      const targetIndex = page * slidesPerView
      setIndex(clamp(targetIndex, 0, maxIndex))
    },
    [maxIndex, slidesPerView],
  )

  const pageCount = useMemo<number>(() => {
    return Math.max(1, Math.ceil(testimonials.length / slidesPerView))
  }, [slidesPerView])

  const currentPage = useMemo<number>(() => {
    if (slidesPerView <= 0) return 0
    return Math.floor(index / slidesPerView)
  }, [index, slidesPerView])

  // Derived arrays to avoid relying on map index as React keys
  const pages: readonly number[] = useMemo<number[]>(() => {
    return Array.from({ length: pageCount }, (_, i) => i)
  }, [pageCount])
  const stars: readonly number[] = useMemo<number[]>(() => {
    return [0, 1, 2, 3, 4]
  }, [])

  if (!enabled) {
    return (
      <section className="py-16 bg-white dark:bg-gray-900">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-12">
            <h2 className="section-title text-black dark:text-white">OUR HAPPY CUSTOMERS</h2>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {testimonials.map((t) => (
              <Card
                key={t.id}
                className="border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 h-full"
              >
                <CardContent className="p-6">
                  <div className="flex items-center gap-1 mb-4">
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
                  <div className="flex items-start gap-2 mb-4">
                    <h4 className="font-semibold text-gray-900 dark:text-gray-100">{t.name}</h4>
                    {t.verified && (
                      <div className="flex items-center gap-1 bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-400 px-2 py-1 rounded-full text-xs">
                        <Check className="h-3 w-3" />
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
    <section className="py-16 bg-white dark:bg-gray-900">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-12">
          <h2 className="section-title text-black dark:text-white">OUR HAPPY CUSTOMERS</h2>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={prev}
              className="border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-800 bg-transparent"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={next}
              className="border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-800 bg-transparent"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div ref={containerRef} className="relative overflow-hidden">
          <motion.div
            className="flex"
            style={{ x }}
            drag="x"
            dragMomentum={false}
            onDragEnd={(_, info) => {
              const offset = info.offset.x
              if (offset < -DRAG_THRESHOLD_PX) {
                next()
              } else if (offset > DRAG_THRESHOLD_PX) {
                prev()
              } else {
                setIndex((prevIndex) => prevIndex)
              }
            }}
          >
            {testimonials.map((t) => (
              <div key={t.id} style={{ width: slideWidth }} className="shrink-0 px-2">
                <Card className="border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 h-full">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-1 mb-4">
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
                    <div className="flex items-start gap-2 mb-4">
                      <h4 className="font-semibold text-gray-900 dark:text-gray-100">{t.name}</h4>
                      {t.verified && (
                        <div className="flex items-center gap-1 bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-400 px-2 py-1 rounded-full text-xs">
                          <Check className="h-3 w-3" />
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
          </motion.div>
          <div
            aria-hidden
            className="pointer-events-none absolute inset-y-0 left-0 w-10 sm:w-16 bg-gradient-to-r from-white dark:from-gray-900 to-transparent"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute inset-y-0 right-0 w-10 sm:w-16 bg-gradient-to-l from-white dark:from-gray-900 to-transparent"
          />
        </div>

        <div className="flex justify-center gap-2 mt-8">
          {pages.map((page) => {
            const active = page === currentPage
            return (
              <button
                key={`page-${page}`}
                onClick={() => goToPage(page)}
                aria-label={`Go to page ${page + 1}`}
                className={
                  active
                    ? "w-2.5 h-2.5 rounded-full bg-black dark:bg-white"
                    : "w-2 h-2 rounded-full bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500"
                }
              />
            )
          })}
        </div>
      </div>
    </section>
  )
}
