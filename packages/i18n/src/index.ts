export type { Currency } from "./format"
export { formatCents, formatCurrency, formatDate } from "./format"
export type { Locale } from "./locale"
export type { Messages, TFunc, TParams, Translations } from "./types"

import type { Locale } from "./locale"
import { en } from "./messages/en"
import { es } from "./messages/es"
import type { Messages, TFunc, TParams, Translations } from "./types"

const translations: Translations = {
  en,
  es,
}

export function getMessages(locale: Locale): Messages {
  return translations[locale] ?? en
}

function interpolate(template: string, params?: TParams): string {
  if (!params) return template
  return template.replace(/\{(.*?)\}/g, (_, k) => String(params[k.trim()] ?? ""))
}

// Simple keypath t: "common.loading" with optional params.
export function createT(locale: Locale): TFunc {
  const messages = getMessages(locale)
  return (key: string, params?: TParams): string => {
    const parts = key.split(".")
    let cur: unknown = messages
    for (const p of parts) {
      if (typeof cur !== "object" || cur === null || !(p in (cur as Record<string, unknown>)))
        return key
      cur = (cur as Record<string, unknown>)[p]
    }
    return typeof cur === "string" ? interpolate(cur, params) : key
  }
}
