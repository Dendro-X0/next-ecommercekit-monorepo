import { defaultLocale, type Locale } from "./config"
import { en } from "./messages/en"
import { es } from "./messages/es"
import { de } from "./messages/de"
import { fr } from "./messages/fr"
import { it } from "./messages/it"
import { ja } from "./messages/ja"
import { ko } from "./messages/ko"
import { pt } from "./messages/pt"
import { ru } from "./messages/ru"
import { zh } from "./messages/zh"
import { ar } from "./messages/ar"
import { nl } from "./messages/nl"
import { pl } from "./messages/pl"
import { tr } from "./messages/tr"
import type { Messages } from "./types"

const registry: Readonly<Record<Locale, Messages>> = {
  en,
  es,
  de,
  fr,
  it,
  ja,
  ko,
  pt,
  ru,
  zh,
  ar,
  nl,
  pl,
  tr,
} as const

export function getMessages(locale: Locale = defaultLocale): Messages {
  return registry[locale] ?? registry[defaultLocale]
}

export function translate(locale: Locale, key: string, fallback?: string): string {
  const msgs = getMessages(locale)
  return (msgs[key] as string | undefined) ?? fallback ?? key
}
