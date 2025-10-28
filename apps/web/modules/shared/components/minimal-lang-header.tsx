"use client"

import type { JSX } from "react"
import { LocaleSwitcher } from "./locale-switcher"

/**
 * MinimalLangHeader: optional thin bar for language switching on homepage.
 * Toggle via NEXT_PUBLIC_ENABLE_MINIMAL_LANG_HEADER=true
 */
export function MinimalLangHeader(): JSX.Element {
  return (
    <div className="w-full bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
      <div className="container mx-auto px-4 h-10 flex items-center justify-end">
        <LocaleSwitcher />
      </div>
    </div>
  )
}
