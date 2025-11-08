import type { Locale } from "./config"

const LOCALE_CURRENCY: Readonly<Record<Locale, string>> = {
  en: "USD",
  es: "USD",
  de: "EUR",
  fr: "EUR",
  it: "EUR",
  ja: "JPY",
  ko: "KRW",
  pt: "EUR",
  ru: "RUB",
  zh: "CNY",
  ar: "USD",
  nl: "EUR",
  pl: "PLN",
  tr: "TRY",
} as const

export function formatCurrency(locale: Locale, amount: number, currency?: string): string {
  const cur = currency ?? LOCALE_CURRENCY[locale] ?? "USD"
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: cur,
    currencyDisplay: "symbol",
  }).format(amount)
}

export function formatDate(
  locale: Locale,
  date: Date | number | string,
  opts: Intl.DateTimeFormatOptions = {},
): string {
  const d = typeof date === "string" || typeof date === "number" ? new Date(date) : date
  return new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "short",
    day: "2-digit",
    ...opts,
  }).format(d)
}
