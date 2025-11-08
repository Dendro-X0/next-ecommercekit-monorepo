export const locales = [
  "en",
  "es",
  "de",
  "fr",
  "it",
  "ja",
  "ko",
  "pt",
  "ru",
  "zh",
  "ar",
  "nl",
  "pl",
  "tr",
] as const
export type Locale = (typeof locales)[number]
export const defaultLocale: Locale = "en"

export function getLocaleFromPath(pathname: string): Locale {
  if (pathname.startsWith("/es")) return "es"
  if (pathname.startsWith("/de")) return "de"
  if (pathname.startsWith("/fr")) return "fr"
  if (pathname.startsWith("/it")) return "it"
  if (pathname.startsWith("/ja")) return "ja"
  if (pathname.startsWith("/ko")) return "ko"
  if (pathname.startsWith("/pt")) return "pt"
  if (pathname.startsWith("/ru")) return "ru"
  if (pathname.startsWith("/zh")) return "zh"
  if (pathname.startsWith("/ar")) return "ar"
  if (pathname.startsWith("/nl")) return "nl"
  if (pathname.startsWith("/pl")) return "pl"
  if (pathname.startsWith("/tr")) return "tr"
  return "en"
}

export function getLocaleFromHeaders(h: { get(name: string): string | null }): Locale {
  const al = h.get("accept-language")?.toLowerCase() ?? ""
  if (al.startsWith("es")) return "es"
  if (al.startsWith("de")) return "de"
  if (al.startsWith("fr")) return "fr"
  if (al.startsWith("it")) return "it"
  if (al.startsWith("ja")) return "ja"
  if (al.startsWith("ko")) return "ko"
  if (al.startsWith("pt")) return "pt"
  if (al.startsWith("ru")) return "ru"
  if (al.startsWith("zh")) return "zh"
  if (al.startsWith("ar")) return "ar"
  if (al.startsWith("nl")) return "nl"
  if (al.startsWith("pl")) return "pl"
  if (al.startsWith("tr")) return "tr"
  return defaultLocale
}
