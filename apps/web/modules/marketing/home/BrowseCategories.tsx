"use client"

import type { LucideIcon } from "lucide-react"
import { BookOpen, ChevronRight, Code2, Image as ImageIcon, Music } from "lucide-react"
import type React from "react"
import { useEffect, useId, useMemo, useState } from "react"
import { SafeImage } from "@/components/ui/safe-image"
import { categoriesApi } from "@/lib/data/categories"
import type { Category as ApiCategory } from "@/types"
import { AppLink } from "../../shared/components/app-link"

/**
 * Category card model for Browse Categories section.
 */
type CategoryCard = Readonly<{
  id: string
  name: string
  slug: string
  image: string
  itemCount: number
  href: string
  badge?: "New" | "Trending" | "Sale"
  icon?: LucideIcon
}>

const ICON_BY_SLUG: Readonly<Partial<Record<string, LucideIcon>>> = {
  "e-books": BookOpen,
  software: Code2,
  audio: Music,
  images: ImageIcon,
} as const

/**
 * Map API category to UI card and attach icon/badge for digital slugs.
 */
function toCard(c: ApiCategory): CategoryCard {
  const icon = ICON_BY_SLUG[c.slug]
  const badge: CategoryCard["badge"] = icon ? "New" : undefined
  return {
    id: c.id,
    name: c.name,
    slug: c.slug,
    image: c.image,
    itemCount: c.productCount,
    href: `/categories/${c.slug}`,
    badge,
    icon,
  } as const
}

/**
 * BrowseCategories renders a responsive, accessible grid of category cards.
 */
export function BrowseCategories(): React.JSX.Element {
  const [items, setItems] = useState<readonly ApiCategory[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [showAll, setShowAll] = useState<boolean>(false)
  const DEFAULT_VISIBLE: number = 8
  const headingId = useId()
  const gridId = useId()

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const res = await categoriesApi.list()
        if (!cancelled) {
          setItems(res.items)
          setError(null)
        }
      } catch (e) {
        if (!cancelled) setError((e as Error).message)
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const cards = useMemo<readonly CategoryCard[]>(() => items.map((c) => toCard(c)), [items])
  const visibleCards = useMemo<readonly CategoryCard[]>(
    () => (showAll ? cards : cards.slice(0, DEFAULT_VISIBLE)),
    [cards, showAll],
  )

  return (
    <section
      className="py-16 bg-gray-50 dark:bg-gray-900"
      aria-labelledby={headingId}
      style={{ contentVisibility: "auto", containIntrinsicSize: "1200px 900px" }}
    >
      <div className="container mx-auto px-4">
        <h2
          id={headingId}
          className="section-title mb-12 text-black dark:text-white"
        >
          BROWSE BY CATEGORY
        </h2>

        {loading ? (
          <div className="rounded-xl border border-dashed border-gray-300 dark:border-gray-700 p-10 text-center text-sm text-gray-500 dark:text-gray-400">
            Loading categories…
          </div>
        ) : error ? (
          <output
            aria-live="polite"
            className="rounded-xl border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950 p-4 text-sm text-red-700 dark:text-red-300"
          >
            Failed to load categories: {error}
          </output>
        ) : cards.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-300 dark:border-gray-700 p-10 text-center text-sm text-gray-500 dark:text-gray-400">
            Categories will appear here.
          </div>
        ) : (
          <>
            <ul
              id={gridId}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
            >
              {visibleCards.map((category: CategoryCard) => (
                <li key={category.id} className="list-none">
                  <AppLink
                    href={category.href}
                    className="group relative block overflow-hidden rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-black dark:focus-visible:ring-white focus-visible:ring-offset-white dark:focus-visible:ring-offset-gray-900"
                    aria-label={`Browse category: ${category.name}`}
                  >
                    <div className="relative aspect-[4/3]">
                      <SafeImage
                        src={`/categories/${category.slug}.jpg`}
                        fallbackSrc={category.image}
                        alt={category.name}
                        fill
                        sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
                        fetchPriority="low"
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/60 via-black/25 to-transparent" />

                      {category.icon && (
                        <span className="absolute left-3 top-3 inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur">
                          <category.icon className="h-4 w-4" aria-hidden />
                        </span>
                      )}

                      <div className="absolute inset-x-0 bottom-0 p-4 flex items-center justify-between">
                        <div>
                          <p className="text-white font-semibold tracking-tight">{category.name}</p>
                          <p className="text-white/80 text-sm">{category.itemCount} items</p>
                        </div>
                        <div className="flex items-center gap-2">
                          {category.badge && (
                            <span className="inline-flex items-center rounded-full bg-white/90 px-2 py-0.5 text-xs font-medium text-gray-900 shadow-sm backdrop-blur">
                              {category.badge}
                            </span>
                          )}
                          <ChevronRight className="h-5 w-5 text-white/90 transition-transform duration-300 group-hover:translate-x-0.5" />
                        </div>
                      </div>
                    </div>
                  </AppLink>
                </li>
              ))}
            </ul>
            {cards.length > DEFAULT_VISIBLE && (
              <div className="mt-8 flex w-full justify-center">
                <button
                  type="button"
                  onClick={(): void => setShowAll((v: boolean): boolean => !v)}
                  className="inline-flex items-center rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 shadow-sm hover:bg-gray-50 dark:hover:bg-gray-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-black dark:focus-visible:ring-white focus-visible:ring-offset-white dark:focus-visible:ring-offset-gray-900"
                  aria-expanded={showAll}
                  aria-controls={gridId}
                >
                  {showAll ? "Show Less" : "Show All"}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  )
}
