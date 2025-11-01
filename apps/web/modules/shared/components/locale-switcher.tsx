"use client"

import { usePathname, useRouter } from "next/navigation"
import { type ChangeEvent, type JSX, useId } from "react"
import { LOCALES_CONFIG } from "@/modules/shared/config/locales"

/**
 * LocaleSwitcher
 * Minimal locale selector for i18n scaffold. Navigates to locale-prefixed path.
 */
export function LocaleSwitcher(): JSX.Element {
  const router = useRouter()
  const pathname: string = usePathname() ?? "/"
  const describedById = useId()
  // Only navigate to locales that are both enabled in config and supported by current routing (en/es).
  const enabledCodes: readonly string[] = LOCALES_CONFIG.options
    .filter((o) => o.enabled)
    .map((o) => o.code)
  const navSupported: readonly ("en" | "es")[] = ["en", "es"] as const

  const currentLocale: "en" | "es" = getCurrentLocale(pathname)

  const handleChange = (e: ChangeEvent<HTMLSelectElement>): void => {
    const code = e.target.value
    if (enabledCodes.includes(code) && (navSupported as readonly string[]).includes(code)) {
      const nextPath = buildPathWithLocale(pathname, code as "en" | "es")
      router.push(nextPath)
    }
  }

  return (
    <label className="inline-flex items-center gap-2 text-sm" aria-label="Select language">
      <span className="sr-only">Language</span>
      <select
        className="border rounded-md px-2 py-1 bg-white dark:bg-gray-900"
        value={currentLocale}
        onChange={handleChange}
        aria-describedby={describedById}
      >
        {LOCALES_CONFIG.options.filter((opt) => opt.enabled).map((opt) => (
          <option
            key={opt.code}
            value={opt.code}
            disabled={false}
            aria-disabled={false}
          >
            {opt.label}
          </option>
        ))}
      </select>
      <span id={describedById} className="sr-only">
        Current language is {currentLocale === "en" ? "English" : "Español"}
      </span>
    </label>
  )
}

function getCurrentLocale(path: string): "en" | "es" {
  if (path.startsWith("/es")) return "es"
  return "en"
}

function buildPathWithLocale(path: string, locale: "en" | "es"): string {
  // Normalize root or existing locale prefix
  if (locale === "en") {
    // Remove leading "/es" if present
    return path.startsWith("/es") ? path.replace(/^\/es(\/|$)/, "/") : path || "/"
  }
  // Ensure "/es" prefix exists exactly once
  if (path.startsWith("/es/")) return path
  if (path === "/es") return path
  return path === "/" ? "/es" : `/es${path}`
}
