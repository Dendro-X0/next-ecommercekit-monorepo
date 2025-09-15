import { defaultLocale, type Locale } from "./config"
import { en } from "./messages/en"
import { es } from "./messages/es"
import type { Messages } from "./types"

const registry: Readonly<Record<Locale, Messages>> = {
  en,
  es,
} as const

export function getMessages(locale: Locale = defaultLocale): Messages {
  return registry[locale] ?? registry[defaultLocale]
}

export function translate(locale: Locale, key: string, fallback?: string): string {
  const msgs = getMessages(locale)
  return (msgs[key] as string | undefined) ?? fallback ?? key
}
