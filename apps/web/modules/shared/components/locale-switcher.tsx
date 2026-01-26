"use client"

import { Globe } from "lucide-react"
import { usePathname, useRouter } from "next/navigation"
import type { JSX } from "react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { LOCALES_CONFIG } from "@/modules/shared/config/locales"

/**
 * LocaleSwitcher
 * Premium locale selector using Shadcn Select.
 */
export function LocaleSwitcher(): JSX.Element {
  const router = useRouter()
  const pathname: string = usePathname() ?? "/"

  // Navigate to any enabled locale code.
  type LocaleCode = (typeof LOCALES_CONFIG.options)[number]["code"]
  const enabledCodes = LOCALES_CONFIG.options
    .filter((o) => o.enabled)
    .map((o) => o.code) as readonly LocaleCode[]

  const currentLocale = getCurrentLocale(pathname)

  const handleValueChange = (value: string): void => {
    if ((enabledCodes as readonly string[]).includes(value)) {
      const nextPath = buildPathWithLocale(pathname, value as LocaleCode)
      router.push(nextPath)
    }
  }

  return (
    <Select value={currentLocale} onValueChange={handleValueChange}>
      <SelectTrigger
        className="w-[140px] h-9 rounded-xl border-border/40 bg-background/50 backdrop-blur-sm hover:bg-accent/50 transition-all font-bold text-[13px]"
      >
        <Globe className="h-4 w-4 mr-2 text-muted-foreground" />
        <SelectValue placeholder="Language" />
      </SelectTrigger>
      <SelectContent className="rounded-xl border-border/40 bg-background/95 backdrop-blur-xl">
        {LOCALES_CONFIG.options
          .filter((opt) => opt.enabled)
          .map((opt) => (
            <SelectItem
              key={opt.code}
              value={opt.code}
              className="rounded-lg font-bold text-[13px] py-2.5"
            >
              {opt.label}
            </SelectItem>
          ))}
      </SelectContent>
    </Select>
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
