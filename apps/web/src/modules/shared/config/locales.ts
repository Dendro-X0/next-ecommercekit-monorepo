type AppLocaleOption = Readonly<{ code: string; label: string; enabled: boolean }>

/**
 * Minimal, flexible locale configuration for the starter template.
 * Only "en" and "es" are enabled by default. Toggle "enabled" to add/remove locales.
 * No translations are required unless you enable a locale and add its messages to @repo/i18n.
 */
export const LOCALES_CONFIG = {
  defaultLocale: "en" as const,
  options: [
    { code: "en", label: "English", enabled: true },
    { code: "de", label: "Deutsch", enabled: false },
    { code: "es", label: "Español", enabled: true },
    { code: "fr", label: "Français", enabled: false },
    { code: "it", label: "Italiano", enabled: false },
    { code: "ja", label: "日本語", enabled: false },
    { code: "ko", label: "한국어", enabled: false },
    { code: "pt", label: "Português", enabled: false },
    { code: "ru", label: "Русский", enabled: false },
    { code: "zh", label: "中文", enabled: false },
  ] as const satisfies readonly AppLocaleOption[],
} as const
