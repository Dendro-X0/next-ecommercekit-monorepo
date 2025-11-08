export type AppLocaleOption = Readonly<{ code: string; label: string; enabled: boolean }>

/**
 * Minimal, flexible locale configuration for the starter template.
 * Only "en" and "es" are enabled by default. Toggle "enabled" to add/remove locales.
 * No translations are required unless you enable a locale and add its messages to @repo/i18n.
 */
export const LOCALES_CONFIG = {
  defaultLocale: "en" as const,
  options: [
    { code: "en", label: "English", enabled: true },
    { code: "de", label: "Deutsch", enabled: true },
    { code: "es", label: "Español", enabled: true },
    { code: "fr", label: "Français", enabled: true },
    { code: "it", label: "Italiano", enabled: true },
    { code: "ja", label: "日本語", enabled: true },
    { code: "ko", label: "한국어", enabled: true },
    { code: "pt", label: "Português", enabled: true },
    { code: "ru", label: "Русский", enabled: true },
    { code: "zh", label: "中文", enabled: true },
    { code: "ar", label: "العربية", enabled: true },
    { code: "nl", label: "Nederlands", enabled: true },
    { code: "pl", label: "Polski", enabled: true },
    { code: "tr", label: "Türkçe", enabled: true },
  ] as const satisfies readonly AppLocaleOption[],
} as const
