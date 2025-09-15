export const locales = ["en", "es"] as const
export type Locale = (typeof locales)[number]
export const defaultLocale: Locale = "en"

export function getLocaleFromPath(pathname: string): Locale {
  if (pathname.startsWith("/es")) return "es"
  return "en"
}

export function getLocaleFromHeaders(h: Headers): Locale {
  const al = h.get("accept-language")?.toLowerCase() ?? ""
  if (al.startsWith("es")) return "es"
  return defaultLocale
}
