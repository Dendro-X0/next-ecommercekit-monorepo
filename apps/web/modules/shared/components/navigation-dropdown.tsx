"use client"

import { ChevronDown } from "lucide-react"
import Image from "next/image"
import type { JSX } from "react"
import { useEffect, useId, useRef, useState } from "react"
import { AppLink } from "./app-link"

const shopCategories = [
  {
    name: "Clothing",
    href: "/categories/clothing",
    image: "/placeholder.svg?height=200&width=200&text=Clothing",
    description: "Discover our latest fashion trends",
  },
  {
    name: "Electronics",
    href: "/categories/electronics",
    image: "/placeholder.svg?height=200&width=200&text=Electronics",
    description: "Latest tech and gadgets",
  },
  {
    name: "Home & Garden",
    href: "/categories/home-garden",
    image: "/placeholder.svg?height=200&width=200&text=Home",
    description: "Everything for your home",
  },
  {
    name: "Sports",
    href: "/categories/sports",
    image: "/placeholder.svg?height=200&width=200&text=Sports",
    description: "Gear up for your activities",
  },
]

interface NavigationDropdownProps {
  title: string
  href?: string
}

export function NavigationDropdown({ title, href }: NavigationDropdownProps): JSX.Element {
  if (title !== "Categories") {
    return (
      <AppLink
        href={href || "#"}
        className="flex items-center gap-1 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-black dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-800 rounded-md transition-all duration-200"
      >
        {title}
      </AppLink>
    )
  }
  return <NavigationDropdownCategories title={title} />
}

function NavigationDropdownCategories({ title }: NavigationDropdownProps): JSX.Element {
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLElement | null>(null)
  const closeTimeoutRef = useRef<number | null>(null)

  // Close on outside click or ESC
  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!containerRef.current) return
      if (isOpen && !containerRef.current.contains(e.target as Node)) setIsOpen(false)
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setIsOpen(false)
    }
    document.addEventListener("mousedown", onDocClick)
    document.addEventListener("keydown", onKey)
    return () => {
      document.removeEventListener("mousedown", onDocClick)
      document.removeEventListener("keydown", onKey)
    }
  }, [isOpen])

  // Optional: small hover grace to reduce flicker
  const openWithGrace = (): void => {
    if (closeTimeoutRef.current) {
      window.clearTimeout(closeTimeoutRef.current)
      closeTimeoutRef.current = null
    }
    setIsOpen(true)
  }
  const closeWithDelay = (): void => {
    if (closeTimeoutRef.current) window.clearTimeout(closeTimeoutRef.current)
    closeTimeoutRef.current = window.setTimeout(() => setIsOpen(false), 250)
  }

  const menuId = useId()

  return (
    <nav
      ref={containerRef}
      className="relative"
      onMouseEnter={openWithGrace}
      onMouseLeave={closeWithDelay}
      aria-haspopup="menu"
      aria-controls={menuId}
      aria-label={`${title} navigation`}
    >
      <button
        type="button"
        aria-expanded={isOpen}
        aria-haspopup="menu"
        onClick={() => setIsOpen((v) => !v)}
        className="flex items-center gap-1 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-black dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-800 rounded-md transition-all duration-200"
      >
        {title}
        <ChevronDown
          className={`h-4 w-4 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {isOpen && (
        <div
          id={menuId}
          role="menu"
          className="absolute top-full left-0 mt-2 w-96 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg dark:shadow-2xl z-50"
        >
          <div className="p-6">
            <div className="grid grid-cols-2 gap-4">
              {shopCategories.map((category) => (
                <AppLink
                  key={category.name}
                  href={category.href}
                  className="group flex flex-col items-center p-4 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  <div className="w-16 h-16 mb-3 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800">
                    <Image
                      src={category.image || "/placeholder.svg"}
                      alt={category.name}
                      width={64}
                      height={64}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                    />
                  </div>
                  <h3 className="font-semibold text-sm text-center mb-1 text-gray-900 dark:text-gray-100">
                    {category.name}
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                    {category.description}
                  </p>
                </AppLink>
              ))}
            </div>
          </div>
        </div>
      )}
    </nav>
  )
}
