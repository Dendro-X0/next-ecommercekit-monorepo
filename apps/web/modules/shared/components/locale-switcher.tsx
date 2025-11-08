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
  // Navigate to any enabled locale code.
  type LocaleCode = (typeof LOCALES_CONFIG.options)[number]["code"]
  const enabledCodes = LOCALES_CONFIG.options
    .filter((o) => o.enabled)
    .map((o) => o.code) as readonly LocaleCode[]

  const currentLocale = getCurrentLocale(pathname)

  const handleChange = (e: ChangeEvent<HTMLSelectElement>): void => {
    const code = e.target.value
    if ((enabledCodes as readonly string[]).includes(code)) {
      const nextPath = buildPathWithLocale(pathname, code as LocaleCode)
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
        {LOCALES_CONFIG.options
          .filter((opt) => opt.enabled)
          .map((opt) => (
            <option key={opt.code} value={opt.code}>
              {opt.label}
            </option>
          ))}
      </select>
      <span id={describedById} className="sr-only">
        Current language is {LOCALES_CONFIG.options.find((o) => o.code === currentLocale)?.label}
      </span>
    </label>
  )
}

function getCurrentLocale(path: string): (typeof LOCALES_CONFIG.options)[number]["code"] {
  type LocaleCode = (typeof LOCALES_CONFIG.options)[number]["code"]
  const seg = (path.split("/")[1] || "") as string
  const enabled = LOCALES_CONFIG.options
    .filter((o) => o.enabled)
    .map((o) => o.code) as readonly LocaleCode[]
  if ((enabled as readonly string[]).includes(seg)) return seg as LocaleCode
  return LOCALES_CONFIG.defaultLocale
}

function buildPathWithLocale(
  path: string,
  locale: (typeof LOCALES_CONFIG.options)[number]["code"],
): string {
  const codes = LOCALES_CONFIG.options
    .filter((o) => o.enabled)
    .map((o) => o.code) as readonly string[]
  const re = new RegExp(`^/(?:${codes.join("|")})(/|$)`)
  const normalized = path.replace(re, "/") || "/"
  if (locale === LOCALES_CONFIG.defaultLocale) return normalized
  return normalized === "/" ? `/${locale}` : `/${locale}${normalized}`
}
