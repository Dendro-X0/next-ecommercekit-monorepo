import type { Locale } from "./locale"

export type Currency = "USD"

const DEFAULT_CURRENCY: Currency = "USD"

export function formatCurrency(
  locale: Locale,
  amount: number,
  currency: Currency = DEFAULT_CURRENCY,
): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    currencyDisplay: "symbol",
  }).format(amount)
}

export function formatCents(
  locale: Locale,
  cents: number,
  currency: Currency = DEFAULT_CURRENCY,
): string {
  const dollars: number = Math.round(cents) / 100
  return formatCurrency(locale, dollars, currency)
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
